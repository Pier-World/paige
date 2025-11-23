import { supabase } from '../supabase';
import type { OrchestratorRequest, OrchestratorResponse } from '../../types/orchestrator';

/**
 * Call the AI orchestrator backend
 *
 * TODO: Replace with actual orchestrator endpoint when ready
 * For now, returns mock responses based on input patterns
 */
export async function callOrchestrator(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/orchestrator', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(request)
    // });
    // return await response.json();

    // Mock response for now
    await new Promise(resolve => setTimeout(resolve, 800));

    return generateMockResponse(request);
  } catch (error) {
    console.error('Error calling orchestrator:', error);
    throw error;
  }
}

/**
 * Generate mock orchestrator responses
 * This will be replaced with real API calls
 */
function generateMockResponse(request: OrchestratorRequest): OrchestratorResponse {
  const input = request.input.toLowerCase();

  // Flight request
  if (input.includes('flight') || input.includes('basel') || input.includes('fly')) {
    return {
      conversationId: `conv_${Date.now()}`,
      messages: [{
        role: 'assistant',
        text: "On it. I found 3 options that save you $3,200+ vs booking direct...",
        modules: [
          {
            type: 'flight_options',
            headline: 'Best options for your trip',
            options: [
              {
                label: 'Private fare through Amex: $1,850',
                description: 'Regular price: $2,400'
              },
              {
                label: 'Redemption option: 45k points + $180',
                description: 'Best value for your points balance'
              },
              {
                label: 'Premium Economy upgrade for 15k points',
                description: 'Available on all 3 flights'
              }
            ]
          },
          {
            type: 'bonus_tip',
            text: "Basel Art Week starts the day you land — I've flagged 4 galleries you'll love."
          },
          {
            type: 'savings_badge',
            amountText: '$3,200+'
          }
        ]
      }]
    };
  }

  // Restaurant/dining request
  if (input.includes('restaurant') || input.includes('reservation') || input.includes('dinner') || input.includes('table')) {
    return {
      conversationId: `conv_${Date.now()}`,
      messages: [{
        role: 'assistant',
        text: "Booked. Table for 2 at 7:30pm — your usual spot by the window.",
        modules: [
          {
            type: 'flight_options',
            headline: "What I've arranged",
            options: [
              {
                label: "Your partner's dietary preferences saved",
                description: 'Updated menu preferences on file'
              },
              {
                label: 'Wine pairing pre-ordered',
                description: 'Based on your history'
              },
              {
                label: 'Car scheduled for 7:15pm pickup',
                description: 'SUV as preferred'
              }
            ]
          },
          {
            type: 'bonus_tip',
            text: "Your investor Sarah mentioned she loves this place — want me to invite her?"
          }
        ]
      }]
    };
  }

  // Perk recommendation request
  if (input.includes('recommend') && input.includes('perk')) {
    return {
      conversationId: `conv_${Date.now()}`,
      messages: [{
        role: 'assistant',
        text: "Based on your preferences and upcoming trips, here are 3 perks you should use this week:",
        modules: [
          {
            type: 'perk_recommendations',
            headline: 'Recommended for you',
            perkIds: ['1', '2', '3']
          }
        ]
      }]
    };
  }

  // Generic request
  return {
    conversationId: `conv_${Date.now()}`,
    messages: [{
      role: 'assistant',
      text: "I'm on it. Let me find the best options for you...",
      modules: []
    }]
  };
}
