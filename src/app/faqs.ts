export const FAQS = [
  {
    question: "Is KanbanThing free?",
    answer:
      "Yes. There is no paid tier to upgrade to and no trial to run out. Every board, every view and every setting is free, and advertising pays for running the site.",
  },
  {
    question: "Do I need an account or a sign-up?",
    answer:
      "No. There is no account, no email address and nothing to install. You name a board, choose a password, and the board exists.",
  },
  {
    question: "How do I share a kanban board with someone?",
    answer:
      "Open the Share menu in the board header, copy the edit link, and send it with the board password. The board lives at its own address rather than in your browser, so anyone you send the link to opens the same board and moves the same cards. There is nobody to invite and no seat to pay for.",
  },
  {
    question: "Can other people edit the board too?",
    answer:
      "Yes. Anyone holding the edit link and the password can add, edit, move and delete cards, and add, rename and delete columns. There are no accounts, so there are no roles either: access is a property of the link somebody is holding. The board does not push other people's changes onto your screen, so reload to see what they did.",
  },
  {
    question: "Is there a read-only link for people who should not edit?",
    answer:
      "Yes. The Share menu also copies a view-only link, which needs no password and shows the board name, the columns and the cards without a card editor, drag and drop, or export. Revoking it invalidates every view-only link you have sent, all at once.",
  },
  {
    question: "How long does a board last?",
    answer:
      "You choose 14, 28 or 60 days when you create the board. Sixty days is the default and also the maximum, and the expiry date cannot be moved afterwards.",
  },
  {
    question: "What happens when a board expires?",
    answer:
      "The board is deleted along with its columns and cards, and it cannot be recovered or renewed. Export the board as JSON or CSV from the board menu before then if you want to keep anything, or start a fresh board and carry the cards over.",
  },
  {
    question: "Who can see my board?",
    answer:
      "Only the people you send the link to. Boards are not listed anywhere and are not indexed by search engines, and every board has a password set when it is created. Anything you type onto a card is stored as you typed it, so passwords, payment details and other sensitive information do not belong on a board.",
  },
  {
    question: "Can an AI agent use a KanbanThing board?",
    answer:
      "Yes. KanbanThing hosts an MCP server, so Claude, ChatGPT, Cursor or any other MCP client can create a board and add, list, move and edit cards. It needs no account, no OAuth and no API key, which is what usually stops an agent from using a task board at all. There is also an installable skill that teaches an agent the conventions.",
  },
  {
    question: "Is there a command line client?",
    answer:
      "Yes. The kanbanthing CLI signs in to a board with its link and password, then lists, adds, edits and moves cards and manages columns from a terminal. Every command takes a --json flag, so a script can drive the same board a person has open in a browser.",
  },
]
