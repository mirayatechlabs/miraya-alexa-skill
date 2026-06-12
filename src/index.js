// src/index.js
const Alexa = require('ask-sdk-core');
const fetch = require('node-fetch'); // built‑in in Alexa‑Hosted runtime

// ---------------------------------------------------------------------------
// Helper: costruisce la risposta SSML usando la voce Francesca (Italiano)
function ssmlReply(text) {
  return `<speak><voice name="Francesca">${text}</voice></speak>`;
}

// ---------------------------------------------------------------------------
// Intent che riceve la domanda dell'utente e la inoltra al tuo backend.
const AskAssistantIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AskAssistantIntent';
  },
  async handle(handlerInput) {
    const question = Alexa.getSlotValue(handlerInput.requestEnvelope, 'question') || '';
    if (!question) {
      const speech = ssmlReply('Mi dispiace, non ho capito la tua richiesta.');
      return handlerInput.responseBuilder.speak(speech).reprompt(speech).getResponse();
    }

    // ---------------------------------------------------------------
    // TODO: Inserisci qui l'URL del tuo servizio web che chiama Gemini.
    const webAppUrl = process.env.WEBAPP_ENDPOINT || 'https://api.tuodominio.com/alexa';
    const apiKey = process.env.WEBAPP_API_KEY || '';

    let reply = 'Mi dispiace, al momento non riesco a rispondere.';
    try {
      const response = await fetch(webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // usa un header personalizzato per autenticazione semplice
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ prompt: question }),
      });
      const data = await response.json();
      if (data && data.reply) {
        reply = data.reply;
      }
    } catch (e) {
      console.error('Error calling web app:', e);
    }
    const speech = ssmlReply(reply);
    return handlerInput.responseBuilder.speak(speech).getResponse();
  },
};

// ---------------------------------------------------------------------------
// Altri handler di base (Launch, Help, Cancel, Fallback, SessionEnded)
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speech = ssmlReply('Benvenuto! Sono Francesca, il tuo assistente Gemini. Dimmi pure cosa vuoi sapere.');
    return handlerInput.responseBuilder.speak(speech).reprompt(speech).getResponse();
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speech = ssmlReply('Puoi chiedermi qualsiasi cosa. Prova con, ad esempio, qual è la capitale della Francia.');
    return handlerInput.responseBuilder.speak(speech).reprompt(speech).getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && (
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
    );
  },
  handle(handlerInput) {
    const speech = ssmlReply('Arrivederci!');
    return handlerInput.responseBuilder.speak(speech).withShouldEndSession(true).getResponse();
  },
};

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const speech = ssmlReply('Scusa, non ho capito. Puoi ripetere?');
    return handlerInput.responseBuilder.speak(speech).reprompt(speech).getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Cleanup logic can be added here.
    return handlerInput.responseBuilder.getResponse(); // empty response
  },
};

// ---------------------------------------------------------------------------
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    AskAssistantIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler
  )
  .lambda();
