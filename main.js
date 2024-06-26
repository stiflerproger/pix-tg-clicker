const IDLE_MIN = 5; // сколько минут бот бездействует

const Menu = {
  $Ref: document.querySelector('a[href="#/ref"]'),
  $Tasks: document.querySelector('a[href="#/tasks"]'),
  $Farm: document.querySelector('a[href="#/"]'),
  $Boost: document.querySelector('a[href="#/boost"]'),
  //$Bots: document.querySelector('a[href="#/bots"]'),
};

const PageSelectors = {
  SelectPetButton: "[class^=_petModalButton_]",
  EnergyCounter: "[class^=_enegryCounter_]",
  ClickAmount: "[class^=_clickNumber_]",
  ExpandMoreMenuButton: "[class^=_navList_] > li:last-child > div",
  BotsMenuButton: 'a[href="#/bots"]',
  ClickableCircle: ".clickBackdrop",
};

let pets = [];
let currentPet = null;

async function start() {
  pets = [];
  await loadPets();

  for (const pet of pets) {
    await selectPet(pet);
    await sleep(1000);

    while (true) {
      console.log("Начинаю фармить за " + pet.name);
      await goto("farm");
      await sleep(1000);
      const energyRechecked = await farm();
      await sleep(2000);

      if (energyRechecked) {
        console.log("Фарм за " + pet.name + " закончен");
        break;
      }

      console.log("Перепроверка потраченной энергии");
      await goto("bots");
      await sleep(2000);
    }
  }

  console.log("Жду " + IDLE_MIN + " минут..");

  await sleep(IDLE_MIN * 60_000);

  start();
}

start();

async function farm() {
  await waitForElement(PageSelectors.EnergyCounter);

  let clickCoords = { x: 0, y: 0 };

  const currentEnergy = document
    .querySelector(PageSelectors.EnergyCounter)
    .innerText.split("/")
    .map((e) => Number(e));

  if (currentEnergy[0] < 20) {
    return true;
  }

  for (let i = 0; i < currentEnergy[0] - 10; i++) {
    if (
      (!clickCoords.x && !clickCoords.y) ||
      document.querySelector(PageSelectors.ClickableCircle)
    ) {
      await waitForElement(PageSelectors.ClickableCircle);

      const coords = document
        .querySelector(PageSelectors.ClickableCircle)
        .getBoundingClientRect();

      clickCoords = {
        x: randomInt(
          Math.floor(coords.left + 1),
          Math.floor(coords.left + coords.width - 1),
        ),
        y: randomInt(
          Math.floor(coords.top + 1),
          Math.floor(coords.top + coords.height - 1),
        ),
      };

      await sleep(randomInt(250, 550));
    }

    let event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      clientX: clickCoords.x,
      clientY: clickCoords.y,
    });

    document
      .elementFromPoint(clickCoords.x, clickCoords.y)
      ?.dispatchEvent(event);
    await sleep(randomInt(80, 170));
  }

  currentPet.power = parseFloat(
    document.querySelector(PageSelectors.ClickAmount)?.innerText,
  );
  console.log("Бот " + currentPet.name + " добывает по " + currentPet.power);

  return false;
}

async function selectPet(pet) {
  await goto("bots");

  const botCards = document.getElementsByClassName("botCard");
  for (const botCard of botCards) {
    const botName = botCard.querySelector(".BotName").innerText;

    if (pet.name === botName) {
      if (!botCard.querySelector(".boughtBotCheck")) {
        botCard.click();
        await sleep(3000);

        await waitForElement(PageSelectors.SelectPetButton);
        document.querySelector(PageSelectors.SelectPetButton).click();
        await sleep(6000);
        return selectPet(pet);
      } else {
        currentPet = pet;
        return true;
      }
    }
  }
}

async function loadPets() {
  await goto("bots");

  const botCards = document.getElementsByClassName("botCard");
  for (const botCard of botCards) {
    pets.push({
      name: botCard.querySelector(".BotName").innerText,
      power: 0, // сколько добывается за клик
    });
  }
}

async function goto(page) {
  if (page === "bots") {
    document.querySelector(PageSelectors.ExpandMoreMenuButton).click();
    await sleep(1000);
    document.querySelector(PageSelectors.BotsMenuButton).click();
    await sleep(1000);

    try {
      await Promise.any([
        waitForElement(".botsList"),
        new Promise((res, rej) => setTimeout(rej, 30_000)),
      ]);
    } catch (e) {
      console.error("Ошибка ожидания питомцев. ");
      await goto("farm");
      return goto("bots");
    }
  }

  if (page === "farm") {
    Menu.$Farm.click();
    await sleep(1000);
    await waitForElement(PageSelectors.EnergyCounter);
  }
}

async function waitForElement(selector) {
  while (true) {
    if (document.querySelector(selector)) break;

    await sleep(500);
  }
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
