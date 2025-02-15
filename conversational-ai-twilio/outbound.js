import fastifyFormBody from '@fastify/formbody';
import fastifyWs from '@fastify/websocket';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import Twilio from 'twilio';
import WebSocket from 'ws';
import fs from 'fs'; // <-- Added for writing JSON files
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Check for required environment variables
const {
  ELEVENLABS_API_KEY,
  ELEVENLABS_AGENT_ID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = process.env;

if (
  !ELEVENLABS_API_KEY ||
  !ELEVENLABS_AGENT_ID ||
  !TWILIO_ACCOUNT_SID ||
  !TWILIO_AUTH_TOKEN ||
  !TWILIO_PHONE_NUMBER
) {
  console.error('Missing required environment variables');
  throw new Error('Missing required environment variables');
}

// Initialize Fastify server
const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

const PORT = process.env.PORT || 8000;

// In-memory log storage: { callSid: [ { timestamp, speaker, message }, ... ] }
const callLogs = {};

/** 
 * Helper function to record a log event in memory
 * @param {string} callSid - The unique call ID
 * @param {string} speaker - e.g., '[Twilio]', '[ElevenLabs]', 'User'
 * @param {string} message - The message to store
 */
function logEvent(callSid, speaker, message) {
  if (!callSid) return; // Only log if we actually have a callSid
  if (!callLogs[callSid]) {
    callLogs[callSid] = [];
  }
  callLogs[callSid].push({
    timestamp: new Date().toISOString(),
    speaker,
    message,
  });
}

function logToFile(conversationId, message) {
  if (!conversationId) {
    console.error('No conversationId provided for logging');
    return;
  }

  try {
    // Create logs directory in the project root
    const logsDir = path.join(process.cwd(), 'logs');
    console.log('Logs directory path:', logsDir);

    if (!fs.existsSync(logsDir)) {
      console.log('Creating logs directory...');
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const logFile = path.join(logsDir, `${conversationId}.txt`);
    console.log('Writing to log file:', logFile);

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Use synchronous write to ensure message is written
    fs.appendFileSync(logFile, logMessage, { encoding: 'utf8' });

    // Verify file was written
    if (fs.existsSync(logFile)) {
      const stats = fs.statSync(logFile);
      console.log(`Log file created/updated. Size: ${stats.size} bytes`);
    } else {
      console.error('Failed to verify log file creation');
    }
  } catch (error) {
    console.error('Error writing to log file:', error);
    console.error('Error details:', {
      conversationId,
      currentDirectory: process.cwd(),
      error: error.message,
      stack: error.stack
    });
  }
}

// Root route for health check
fastify.get('/', async (_, reply) => {
  reply.send({ message: 'Server is running' });
});

// Initialize Twilio client
const twilioClient = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Helper function to get signed URL for authenticated conversations
async function getSignedUrl() {
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get signed URL: ${response.statusText}`);
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
}

// Route to initiate outbound calls
fastify.post('/outbound-call', async (request, reply) => {
  const { number, prompt, first_message } = request.body;

  if (!number) {
    return reply.code(400).send({ error: 'Phone number is required' });
  }

  try {
    const call = await twilioClient.calls.create({
      from: TWILIO_PHONE_NUMBER,
      to: number,
      url: `https://${request.headers.host}/outbound-call-twiml?prompt=${encodeURIComponent(
        prompt
      )}&first_message=${encodeURIComponent(first_message)}`,
    });

    reply.send({
      success: true,
      message: 'Call initiated',
      callSid: call.sid,
    });
  } catch (error) {
    console.error('Error initiating outbound call:', error);
    reply.code(500).send({
      success: false,
      error: 'Failed to initiate call',
    });
  }
});

// TwiML route for outbound calls
fastify.all('/outbound-call-twiml', async (request, reply) => {
  const prompt = request.query.prompt || '';
  const first_message = request.query.first_message || '';

  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${request.headers.host}/outbound-media-stream">
          <Parameter name="prompt" value="${prompt}" />
          <Parameter name="first_message" value="${first_message}" />
        </Stream>
      </Connect>
    </Response>`;

  reply.type('text/xml').send(twimlResponse);
});

// WebSocket route for handling media streams
fastify.register(async (fastifyInstance) => {
  fastifyInstance.get('/outbound-media-stream', { websocket: true }, (ws, req) => {
    console.info('[Server] Twilio connected to outbound media stream');

    let streamSid = null;
    let callSid = null;
    let elevenLabsWs = null;
    let customParameters = null;

    ws.on('error', console.error);

    const setupElevenLabs = async () => {
      try {
        const signedUrl = await getSignedUrl();
        elevenLabsWs = new WebSocket(signedUrl);

        elevenLabsWs.on('open', () => {
          console.log('[ElevenLabs] Connected to Conversational AI');
          logEvent(callSid, '[ElevenLabs]', 'Connected to Conversational AI');

          const initialConfig = {
            type: 'conversation_initiation_client_data',
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: customParameters?.prompt || 'you are a gary from the phone store',
                },
                first_message:
                  customParameters?.first_message || 'hey there! how can I help you today?',
              },
            },
          };

          console.log(
            '[ElevenLabs] Sending initial config with prompt:',
            initialConfig.conversation_config_override.agent.prompt.prompt
          );
          logEvent(
            callSid,
            '[ElevenLabs]',
            `Sending initial config with prompt: ${
              initialConfig.conversation_config_override.agent.prompt.prompt
            }`
          );

          elevenLabsWs.send(JSON.stringify(initialConfig));
        });

        elevenLabsWs.on('message', (data) => {
          try {
            const message = JSON.parse(data);

            switch (message.type) {
              case 'conversation_initiation_metadata':
                console.log('[ElevenLabs] Received initiation metadata');
                logEvent(callSid, '[ElevenLabs]', 'Received initiation metadata');
                break;

              case 'audio':
                if (streamSid) {
                  if (message.audio?.chunk) {
                    const audioData = {
                      event: 'media',
                      streamSid,
                      media: {
                        payload: message.audio.chunk,
                      },
                    };
                    ws.send(JSON.stringify(audioData));
                  } else if (message.audio_event?.audio_base_64) {
                    const audioData = {
                      event: 'media',
                      streamSid,
                      media: {
                        payload: message.audio_event.audio_base_64,
                      },
                    };
                    ws.send(JSON.stringify(audioData));
                  }
                } else {
                  console.log('[ElevenLabs] Received audio but no StreamSid yet');
                  logEvent(
                    callSid,
                    '[ElevenLabs]',
                    'Received audio but no StreamSid yet'
                  );
                }
                break;

              case 'interruption':
                if (streamSid) {
                  ws.send(
                    JSON.stringify({
                      event: 'clear',
                      streamSid,
                    })
                  );
                }
                break;

              case 'ping':
                if (message.ping_event?.event_id) {
                  elevenLabsWs.send(
                    JSON.stringify({
                      type: 'pong',
                      event_id: message.ping_event.event_id,
                    })
                  );
                }
                break;

              case 'agent_response':
                console.log(
                  `[Twilio] Agent response: ${message.agent_response_event?.agent_response}`
                );
                logEvent(
                  callSid,
                  '[Twilio]',
                  `Agent response: ${message.agent_response_event?.agent_response}`
                );
                break;

              case 'user_transcript':
                console.log(
                  `[Twilio] User transcript: ${message.user_transcription_event?.user_transcript}`
                );
                logEvent(
                  callSid,
                  'User',
                  message.user_transcription_event?.user_transcript || ''
                );
                break;

              default:
                console.log(`[ElevenLabs] Unhandled message type: ${message.type}`);
                logEvent(
                  callSid,
                  '[ElevenLabs]',
                  `Unhandled message type: ${message.type}`
                );
            }
          } catch (error) {
            console.error('[ElevenLabs] Error processing message:', error);
            logEvent(callSid, '[ElevenLabs]', `Error: ${error}`);
          }
        });

        elevenLabsWs.on('error', (error) => {
          console.error('[ElevenLabs] WebSocket error:', error);
          logEvent(callSid, '[ElevenLabs]', `WebSocket error: ${error.message}`);
        });

        elevenLabsWs.on('close', () => {
          console.log('[ElevenLabs] Disconnected');
          logEvent(callSid, '[ElevenLabs]', 'Disconnected');
        });
      } catch (error) {
        console.error('[ElevenLabs] Setup error:', error);
        logEvent(callSid, '[ElevenLabs]', `Setup error: ${error.message}`);
      }
    };

    setupElevenLabs();

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        if (msg.event !== 'media') {
          console.log(`[Twilio] Received event: ${msg.event}`);
          logEvent(callSid, '[Twilio]', `Received event: ${msg.event}`);
        }

        switch (msg.event) {
          case 'start':
            streamSid = msg.start.streamSid;
            callSid = msg.start.callSid;
            customParameters = msg.start.customParameters;
            console.log(
              `[Twilio] Stream started - StreamSid: ${streamSid}, CallSid: ${callSid}`
            );
            logEvent(
              callSid,
              '[Twilio]',
              `Stream started - StreamSid: ${streamSid}, CallSid: ${callSid}`
            );
            if (customParameters) {
              console.log('[Twilio] Start parameters:', customParameters);
              logEvent(callSid, '[Twilio]', `Start parameters: ${JSON.stringify(customParameters)}`);
            }
            break;

          case 'media':
            if (elevenLabsWs?.readyState === WebSocket.OPEN) {
              const audioMessage = {
                user_audio_chunk: Buffer.from(msg.media.payload, 'base64').toString('base64'),
              };
              elevenLabsWs.send(JSON.stringify(audioMessage));
            }
            break;

          case 'stop':
            console.log(`[Twilio] Stream ${streamSid} ended`);
            logEvent(callSid, '[Twilio]', `Stream ${streamSid} ended`);
            if (elevenLabsWs?.readyState === WebSocket.OPEN) {
              elevenLabsWs.close();
            }
            break;

          default:
            console.log(`[Twilio] Unhandled event: ${msg.event}`);
            logEvent(callSid, '[Twilio]', `Unhandled event: ${msg.event}`);
        }
      } catch (error) {
        console.error('[Twilio] Error processing message:', error);
        logEvent(callSid, '[Twilio]', `Error processing message: ${error.message}`);
      }
    });

    ws.on('close', () => {
      console.log('[Twilio] Client disconnected');
      logEvent(callSid, '[Twilio]', 'Client disconnected');

      if (elevenLabsWs?.readyState === WebSocket.OPEN) {
        elevenLabsWs.close();
      }

      if (callSid && callLogs[callSid]) {
        const outputFile = `conversation-${callSid}.json`;
        fs.writeFileSync(
          outputFile,
          JSON.stringify({ conversation: callLogs[callSid] }, null, 2),
          'utf-8'
        );
        console.log(`[Server] Conversation for CallSid ${callSid} written to ${outputFile}`);

        delete callLogs[callSid];
      }
    });
  });
});

// Start the Fastify server
fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
  console.log(`[Server] Listening on port ${PORT}`);
});
