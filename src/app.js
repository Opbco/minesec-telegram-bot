require("dotenv").config();
const fs = require("fs");
const {
  getCompositionDossier,
  getResetMinesecAccount,
  getListAvailableAvancement,
} = require("./utils");

const TelegramBot = require("node-telegram-bot-api");

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

global.avancementFiles = fs.readdirSync("./src/avancements");

// Listener (handler) for telegram's /start event
// This event happened when you start the conversation with both by the very first time
// Provide the list of available commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `
        Welcome at <b>MINESEC-bot</b>, thank you for using this service
    
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
            Welcome at <b>MINESEC-bot</b>, thank you for using this service
        
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

// Listener (handler) for telegram's /dossier event
bot.onText(/\/dossier/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message
  const chatId = msg.chat.id;

  bot.sendMessage(
    chatId,
    "Quel dossier souhaitez vous obtenir la composition?",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Mise en stage",
              callback_data: JSON.stringify({
                command: "dossier",
                answer: "mise en stage",
              }),
            },
          ],
          [
            {
              text: "Pension retraite / Mise en retraite",
              callback_data: JSON.stringify({
                command: "dossier",
                answer: "pension retraite",
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
                command: "dossier",
                answer: "study leave",
              }),
            },
          ],
          [
            {
              text: "Retirement decision",
              callback_data: JSON.stringify({
                command: "dossier",
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

  if (answer.command == "dossier" || answer.command == "file") {
    res = await getCompositionDossier(answer.answer);
    try {
      bot.sendMessage(message.chat.id, res, {
        reply_to_message_id: message.message_id,
      });
    } catch (error) {
      console.log(error);
    }
  }
});
