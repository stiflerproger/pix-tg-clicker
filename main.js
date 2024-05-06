const IDLE_MIN = 6; // сколько минут бот бездействует

        const Menu = {
            $Ref: document.querySelector('a[href="#/ref"]'),
            $Tasks: document.querySelector('a[href="#/tasks"]'),
            $Farm: document.querySelector('a[href="#/"]'),
            $Boost: document.querySelector('a[href="#/boost"]'),
            $Bots: document.querySelector('a[href="#/bots"]'),
        }

        const PageSelectors = {
            SelectPetButton: '._petModalButton_f3iay_805',
            EnergyCounter: '._enegryCounter_f3iay_137',
            ClickerButton: '._clickerButton_f3iay_318',
        }

        let pets = [];

        async function start() {
            pets = [];
            await loadPets();

            for (const pet of pets) {
                await selectPet(pet);
                await sleep(1000);

                while (true) {
                    console.log('Начнаю фармить за ' + pet.name);
                    await goto('farm');
                    await sleep(1000);
                    const energyRechecked = await farm();
                    await sleep(2000);

                    if (energyRechecked) {
                        console.log('Фарм за ' + pet.name + ' закончен');
                        break;
                    }

                    console.log('Перепроверка потраченной энергии');
                    await goto('bots');
                    await sleep(2000);
                }

            }

            console.log('Жду ' + IDLE_MIN + ' минут..');

            await sleep(IDLE_MIN * 60_000);

            start();
        }

        start();

        async function farm() {
            await waitForElement(PageSelectors.ClickerButton);
            const clickerBtn = document.querySelector(PageSelectors.ClickerButton);

            const currentEnergy = document.querySelector(PageSelectors.EnergyCounter).innerText.split('/').map(e => Number(e));

            if (currentEnergy[0] < 20) {
                return true;
            }

            for (let i = 0; i < currentEnergy[0] - 10; i++) {
                clickerBtn.click();
                await sleep(randomInt(80, 170));
            }

            return false;
        }

        async function selectPet(pet) {
            await goto('bots');

            const botCards = document.getElementsByClassName('botCard');
            for (const botCard of botCards) {
                const botName = botCard.querySelector('.BotName').innerText;

                if (pet.name === botName) {
                    if (!botCard.querySelector('.boughtBotCheck')) {
                        botCard.click();
                        await sleep(1000);

                        await waitForElement(PageSelectors.SelectPetButton);
                        document.querySelector(PageSelectors.SelectPetButton).click();
                        await sleep(3000);
                        return selectPet(pet);
                    } else {
                        return true;
                    }
                }
            }
        }

        async function loadPets() {
            await goto('bots');

            const botCards = document.getElementsByClassName('botCard');
            for (const botCard of botCards) {
                pets.push({
                    name: botCard.querySelector('.BotName').innerText,
                });
            }

            console.log('Мои питомцы:', pets);
        }

        async function goto(page) {
            if (page === 'bots') {
                Menu.$Bots.click();
                await sleep(1000);
                await waitForElement('.botsList');
            }

            if (page === 'farm') {
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
            return new Promise(res => setTimeout(res, ms));
        }

        function randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
