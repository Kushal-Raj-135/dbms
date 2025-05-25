const express = require('express');
const axios = require('axios');

const router = express.Router();

// Initialize OpenAI API key
const OPENAI_API_KEY = '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';

// Helper function to calculate distance between two points
function calculateDistance(start, end) {
    try {
        const [lat1, lon1] = start.split(',').map(Number);
        const [lat2, lon2] = end.split(',').map(Number);
        
        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            throw new Error('Invalid coordinates format');
        }
        
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    } catch (error) {
        throw new Error(`Error calculating distance: ${error.message}`);
    }
}

// Helper function to make AI API call
async function getAIRecommendation(prompt) {
    try {
        console.log('Making request to OpenAI API...');
        
        const response = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            data: {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that recommends cars based on customer needs. Always respond in JSON format with model, reason, and alternatives."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500,
                response_format: { type: "json_object" }
            }
        });

        console.log('Response received:', response.data?.choices?.[0]?.message?.content);
        
        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from OpenAI API');
        }

        return response.data;
    } catch (error) {
        console.error('OpenAI API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || error.message || 'Failed to get AI recommendation');
    }
}

router.post('/', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        const { numPeople, startLocation, endLocation } = req.body;

        // 1. Input Validation
        if (!numPeople || !startLocation || !endLocation) {
            return res.status(400).json({
                error: 'Missing required parameters',
                details: 'numPeople, startLocation, and endLocation are required'
            });
        }

        if (typeof numPeople !== 'number' || numPeople < 1) {
            return res.status(400).json({
                error: 'Invalid number of people',
                details: 'numPeople must be a positive number'
            });
        }

        // 2. Calculate Distance
        let distance;
        try {
            distance = calculateDistance(startLocation, endLocation);
            console.log('Distance calculated:', distance, 'km');
        } catch (error) {
            return res.status(400).json({
                error: 'Invalid location format',
                details: error.message
            });
        }

        // 3. Database Query
        let availableCars;
        try {
            if (!req.db) {
                throw new Error('Database connection not available');
            }
            
            const [rows] = await req.db.query(
                'SELECT * FROM Car WHERE Status IN ("Free", "Available")'
            );
            availableCars = rows;
            console.log('Available cars found:', availableCars.length);
            
            if (!availableCars || availableCars.length === 0) {
                return res.status(404).json({
                    error: 'No available cars found',
                    details: 'No cars are currently available for rental'
                });
            }
        } catch (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                error: 'Database error',
                details: error.message
            });
        }

        // 4. Prepare AI Prompt
        const prompt = `Based on these requirements, recommend the best car:

JOURNEY DETAILS:
* Passengers: ${numPeople}
* Distance: ${distance.toFixed(2)} km

AVAILABLE CARS:
${availableCars.map(car => 
`* ${car.Model} (${car.Company})
  - Number Plate: ${car.Number_Plate}
  - Daily Rate: $${car.Rent_Per_Day}`
).join('\n')}

REQUIREMENTS:
1. Must fit ${numPeople} passengers
2. Suitable for ${distance.toFixed(2)} km journey
3. Cost-effective
4. Good comfort level

Respond in this exact JSON format:
{
    "model": "EXACT_MODEL_FROM_LIST",
    "reason": "CLEAR_EXPLANATION",
    "alternatives": [
        {
            "model": "EXACT_MODEL_FROM_LIST",
            "reason": "BRIEF_REASON"
        },
        {
            "model": "EXACT_MODEL_FROM_LIST",
            "reason": "BRIEF_REASON"
        }
    ]
}`;

        // 5. Get AI Recommendation
        try {
            const aiResult = await getAIRecommendation(prompt);
            
            if (!aiResult.choices || !aiResult.choices[0]) {
                throw new Error('Invalid AI response format');
            }

            const aiResponse = aiResult.choices[0].message.content;
            console.log('AI Response:', aiResponse);

            // 6. Parse and Validate AI Response
            let parsedResponse;
            try {
                const cleanedText = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
                parsedResponse = JSON.parse(cleanedText);
            } catch (parseError) {
                throw new Error('Failed to parse AI response as JSON');
            }

            if (!parsedResponse.model || !parsedResponse.reason || !Array.isArray(parsedResponse.alternatives)) {
                throw new Error('Invalid response structure from AI');
            }

            // 7. Verify Recommendation
            const recommendedCar = availableCars.find(car => car.Model.toString() === parsedResponse.model.toString());
            if (!recommendedCar) {
                throw new Error('AI recommended a car that is not available');
            }

            // 8. Prepare Final Response
            const enrichedResponse = {
                ...parsedResponse,
                carDetails: {
                    model: recommendedCar.Model,
                    company: recommendedCar.Company,
                    rentPerDay: recommendedCar.Rent_Per_Day,
                    numberPlate: recommendedCar.Number_Plate
                },
                journeyDetails: {
                    distance: distance.toFixed(2),
                    passengers: numPeople
                }
            };

            res.json(enrichedResponse);
        } catch (aiError) {
            console.error('AI Error:', aiError);
            return res.status(500).json({
                error: 'AI processing failed',
                details: aiError.response?.data?.error?.message || aiError.message
            });
        }
    } catch (error) {
        console.error('General Error:', error);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

module.exports = router; 