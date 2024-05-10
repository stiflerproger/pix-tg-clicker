const IDLE_MIN = 5; // сколько минут бот бездействует

const Menu = {
  $Ref: document.querySelector('a[href="#/ref"]'),
  $Tasks: document.querySelector('a[href="#/tasks"]'),
  $Farm: document.querySelector('a[href="#/"]'),
  $Boost: document.querySelector('a[href="#/boost"]'),
  $Bots: document.querySelector('a[href="#/bots"]'),
};

const PageSelectors = {
  SelectPetButton: "._petModalButton_{reactPrefix}_805",
  EnergyCounter: "._enegryCounter_{reactPrefix}_137",
  ClickerButton: "._clickerButton_{reactPrefix}_318",
  ClickAmount: "._clickNumber_{reactPrefix}_332",
};

let pets = [];
let currentPet = null;

async function start() {
  loadReactPrefix();

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

function loadReactPrefix() {
  const containerClass = document.querySelector("#root > div > div").className; // _container_1n9vr_1

  const arr = containerClass.split("_");

  const reactCustomClassPrefix = arr[arr.length - 2];

  console.log("reactPrefix:", reactCustomClassPrefix);

  for (const key in PageSelectors) {
    PageSelectors[key] = PageSelectors[key].replace(
      "{reactPrefix}",
      reactCustomClassPrefix,
    );
  }
}

async function farm() {
  await waitForElement(PageSelectors.ClickerButton);
  const clickerBtn = document.querySelector(PageSelectors.ClickerButton);

  const currentEnergy = document
    .querySelector(PageSelectors.EnergyCounter)
    .innerText.split("/")
    .map((e) => Number(e));

  if (currentEnergy[0] < 20) {
    return true;
  }

  for (let i = 0; i < currentEnergy[0] - 10; i++) {
    clickerBtn.click();
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
    Menu.$Bots.click();
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
