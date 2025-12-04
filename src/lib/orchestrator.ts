// Orchestrator API client
import { supabase } from './supabase';

export interface OrchestratorResponse {
  success: boolean;
  task: {
    id: string;
    title: string;
    description?: string;
    status: string;
    ui_state?: any;
    confidence_score?: number;
    decision_strategy?: string;
  };
  response: string;
  intent: string;
  confidence: number;
  strategy: string;
  error?: string;
}

export async function callOrchestrator(
  userId: string,
  message: string,
  relatedTaskId?: string
): Promise<OrchestratorResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/orchestrator/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        message,
        relatedTaskId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Orchestrator response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Orchestrator failed (${response.status}): ${errorText}`);
    }

    const result: OrchestratorResponse = await response.json();
    
    // Log for debugging
    console.log('Orchestrator response:', {
      success: result.success,
      taskId: result.task?.id,
      intent: result.intent,
      strategy: result.strategy
    });
    
    return result;
  } catch (error) {
    console.error('Error calling orchestrator:', error);
    throw error;
  }
}

