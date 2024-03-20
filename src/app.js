require("dotenv").config();
const fs = require("fs");
const {
  getCompositionDossier,
  getResetMinesecAccount,
  getListAvailableAvancement,
  getTypeDossier,
  getCompositionDossierById,
} = require("./utils");

const TelegramBot = require("node-telegram-bot-api");

global.avancementFiles = fs.readdirSync("./src/avancements");

const token = process.env.TOKEN;

const HI = [
  "bonjour",
  "bjr",
  "hi",
  "hello",
  "good",
  "bonsoir",
  "bsr",
  "slt",
  "salut",
  "evening",
  "afternoon",
  "morning",
];

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

//lets wait for the page to totally load
// Listener (handler) for telegram's /start event
// This event happened when you start the conversation with both by the very first time
// Provide the list of available commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
        Welcome at <b>MINESEC-COURRIER</b>, thank <i><b>${msg.from.first_name}</b></i> for using this service
    
        Available commands:
    
        <b>/dossier</b> - obtenir la liste des pièces constitutives d'un dossier
        <b>/file</b> - obtain the list of documents to compile for a demande
        <b>/advancements [Matricule]</b> - obtain all the electronic copy of your signed advancement
    `,
    {
      parse_mode: "HTML",
    }
  );
});

bot.on("message", (msg) => {
  if (HI.some((i) => msg.text.toString().toLowerCase().indexOf(i) === 0)) {
    bot.sendMessage(
      msg.chat.id,
      `
            Welcome at <b>MINESEC-COURRIER</b>,  thank <i><b>${msg.from.first_name}</b></i> for using this service
        
            Available commands:
        
        <b>/dossier</b> - obtenir la liste des pièces constitutives d'un dossier
        <b>/file</b> - obtain the list of documents to compile for a demande
        <b>/advancements [Matricule]</b> - obtain all the electronic copy of your signed advancement

            `,
      {
        parse_mode: "HTML",
        reply_to_message_id: msg.message_id,
      }
    );
  }
});

// Matches "/advancements [matricule]"
bot.onText(
  /\/advancements ([0-9]{6}-[A-Za-z]{1}|[A-Za-z]{1}-[0-9]{6})/,
  (msg, match) => {
    // 'msg' is the received Message from Telegram
    // 'match' is the result of executing the regexp above on the text content
    // of the message

    const chatId = msg.chat.id;
    const resp = match[1]; // the captured "whatever"

    // send back the matched "matricule" to the chat
    bot.sendMessage(
      chatId,
      `list of advancements availables for the matricule ${resp}`
    );
    let pdfs = getListAvailableAvancement(resp.trim());
    if (Array.isArray(pdfs)) {
      pdfs.forEach(async (pdf) => {
        const caption = pdf.split("/");
        try {
          const stream = fs.createReadStream(pdf);
          bot.sendDocument(chatId, stream, {
            caption: `${caption[caption.length - 1]}`,
            reply_to_message_id: msg.message_id,
          });
        } catch (error) {
          console.error("Error when sending: ", error); //return object error
        }
      });
    } else {
      bot.sendMessage(chatId, pdfs);
    }
  }
);

// Listener (handler) for telegram's /position event
bot.onText(/\/position/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "Quel structure souhaitez vous obtenir la localisation?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Ministère",
              callback_data: JSON.stringify({
                command: "position",
                answer: "ministry",
              }),
            },
          ],
          [
            {
              text: "CAAP",
              callback_data: JSON.stringify({
                command: "position",
                answer: "caap",
              }),
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
        force_reply: true,
      },
    }
  );
});

// Listener (handler) for telegram's /dossier event
bot.onText(/\/dossier/, async (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;

  try {
    const res = await getTypeDossier();
    bot.sendMessage(
      chatId,
      "Quel dossier souhaitez vous obtenir la composition?",
      {
        reply_markup: {
          inline_keyboard: res,
          resize_keyboard: true,
          one_time_keyboard: true,
          force_reply: true,
        },
      }
    );
  } catch (error) {
    console.log(error);
  }

});

// Listener (handler) for telegram's /dossier event
bot.onText(/\/file/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "Which demande do you want to obtain the list of documents to compile?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Study leave",
              callback_data: JSON.stringify({
                command: "docssier",
                answer: "study leave",
              }),
            },
          ],
          [
            {
              text: "Retirement decision",
              callback_data: JSON.stringify({
                command: "docssier",
                answer: "retirement pension",
              }),
            },
          ],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
        force_reply: true,
      },
    }
  );
});

// Listener (handler) for callback data from /label command
bot.on("callback_query", async (callbackQuery) => {
  const message = callbackQuery.message;
  const answer = JSON.parse(callbackQuery.data);

  if (answer.command == "dossier") {
    const res = await getCompositionDossierById(answer.answer);
    try {
      //bot.answerCallbackQuery(callbackQuery.id, res);
      bot.sendMessage(message.chat.id, res, {
        reply_to_message_id: message.message_id,
      }); 
    } catch (error) {
      console.log(error);
    }
  }

  if (answer.command == "docssier" || answer.command == "file") {
    const res = await getCompositionDossier(answer.answer);
    try {
      bot.sendMessage(message.chat.id, res, {
        reply_to_message_id: message.message_id,
      });
    } catch (error) {
      console.log(error);
    }
  }

  if (answer.command == "position") {
    try {
      switch (answer.answer) {
        case "caap":
          await bot.sendLocation(message.chat.id, 3.8623617, 11.5198315, {
            reply_to_message_id: message.message_id,
          });
          break;
        default:
          await bot.sendLocation(message.chat.id, 3.8667377, 11.5120083, {
            reply_to_message_id: message.message_id,
          });
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }
});
