import { libWrapper } from "./../lib/libWrapper/shim.js";
import { DND5E } from './../../../systems/dnd5e/module/config.js';
import HDLongRestDialog from "./ros-long-rest.js";
import ShortRestDialog from "./../../../systems/dnd5e/module/apps/short-rest.js";
import ActorSheet5eCharacter from "./../../../systems/dnd5e/module/actor/sheets/character.js";
import Actor5E from "./../../../systems/dnd5e/module/actor/entity.js";

function capitalizeFirstLetter(str) {
	return str[0].toUpperCase() + str.slice(1);
};


function patch_displayRestResultMessage() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype._displayRestResultMessage",
         /**
         * Display a chat message with the result of a rest.
         *
         * @param {RestResult} result         Result of the rest operation.
         * @param {boolean} [longRest=false]  Is this a long rest?
         * @returns {Promise<ChatMessage>}    Chat message that was created.
         * @protected
         */
        async function patched_displayRestResultMessage(result, longRest=false) {
            const { dhd, dhp, newDay } = result;
            const diceRestored = dhd !== 0;
            const healthRestored = dhp !== 0;
            const length = longRest ? "Long" : "Short";

            let restFlavor;
            let message;

            // Summarize the rest duration
/*             switch (game.settings.get("dnd5e", "restVariant")) {
            case "normal": restFlavor = (longRest && newDay) ? "ROS.LongRestOvernight" : `ROS.${length}RestNormal`; break;
            case "gritty": restFlavor = (!longRest && newDay) ? "ROS.ShortRestOvernight" : `ROS.${length}RestGritty`; break;
            case "epic": restFlavor = `ROS.${length}RestEpic`; break;
            } */
            if (longRest){
                restFlavor = (newDay) ? "ROS.LongRestOvernight" : `ROS.${length}RestNormal`;
            } else {
                restFlavor = (newDay) ? "ROS.ShortRestOvernight" : "ROS.ShortRestOvernight";

            }

            // Determine the chat message to display
            if ( diceRestored && healthRestored ) message = `ROS.${length}RestResult`;
            else if ( longRest && !diceRestored && healthRestored ) message = "ROS.LongRestResultHitPoints";
            else if ( longRest && diceRestored && !healthRestored ) message = "ROS.LongRestResultHitDice";
            else message = `ROS.${length}RestResultShort`;
            
            // Create a chat message
            let chatData = {
            user: game.user.id,
            speaker: {actor: this, alias: this.name},
            flavor: game.i18n.localize(restFlavor),
            content: game.i18n.format(message, {
                name: this.name,
                dice: longRest ? dhd : -dhd,
                health: dhp
            })
            };
            ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
            return ChatMessage.create(chatData);
        },
    "OVERRIDE",
    );
}


function patch_newShortRest() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype.shortRest",
        async function patchedShortRest(...args) {
            let { chat=true, dialog=true, autoHD=false, autoHDThreshold=3} = args[0] ?? {};
            const hd0 = this.data.data.attributes.hd;
            const hp0 = this.data.data.attributes.hp.value;
            let newDay = false;

            const tempCorruption0 = this.data.data.resources.primary.value;
            const profBonus = parseInt(this.data.data.attributes.prof);
            await this.update({ "data.resources.primary.value": Math.max(tempCorruption0 - profBonus,0) })
            
            let restFlavor = "ROS.ShortRest";
            let message = "RoS.ShortRestStep1";
            let chatData = {
                user: game.user.id,
                speaker: {actor: this, alias: this.name},
                flavor: game.i18n.localize(restFlavor),
                content: game.i18n.format(message, {
                  name: this.name,
                  tempcorr: Math.min(profBonus,tempCorruption0)
                })
              };

            ChatMessage.create(chatData)
            // Maybe present a confirmation dialog
            if (dialog) {
                try {
                    newDay = await ShortRestDialog.shortRestDialog({ actor: this });
                } catch (err) {
                    return;
                }
            }

            const dhd = this.data.data.attributes.hd - hd0;
            const dhp = this.data.data.attributes.hp.value - hp0;
            return this._rest(chat, newDay, false, dhd, dhp);
        },
        "OVERRIDE",
    );
}


function patch_newLongRest() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype.longRest",
        async function patchedLongRest(...args) {
            let { chat=true, dialog=true, newDay=true } = args[0] ?? {};

            const hd0 = this.data.data.attributes.hd;
            const hp0 = this.data.data.attributes.hp.value;
            const tempCorruption0 = this.data.data.resources.primary.value;
            const profBonus = parseInt(this.data.data.attributes.prof);
                   
            const maxHD =parseInt(this.data.items.find(i => i.type === "class")?.data?.data?.hitDice?.substring(1));

            // Before spending hit dice, recover a fraction of missing hit points and reduce temporary corruption

            const maxHP = this.data.data.attributes.hp.max;
            const recoveredHP = maxHD + this.data.data.abilities.con.mod;

            await this.update({ "data.attributes.hp.value": Math.min(hp0 + recoveredHP, maxHP) });
            await this.update({ "data.resources.primary.value": Math.max(tempCorruption0 - 2*profBonus,0) })

            let restFlavor = "ROS.LongRest";
            let message = "ROS.LongRestStep1";
            let chatData = {
                user: game.user.id,
                speaker: {actor: this, alias: this.name},
                flavor: game.i18n.localize(restFlavor),
                content: game.i18n.format(message, {
                  name: this.name,
                  tempcorr: Math.min(2*profBonus,tempCorruption0),
                  health: this.data.data.attributes.hp.value - hp0
                })
              };
            ChatMessage.create(chatData)

            // Maybe present a confirmation dialog
            if (dialog) {
                try {
                    newDay = await HDLongRestDialog.hdLongRestDialog({ actor: this });
                } catch (err) {
                    return;
                }
            }

            const dhd = this.data.data.attributes.hd - hd0;
            const dhp = this.data.data.attributes.hp.value - hp0;
            return this._rest(chat, newDay, true, dhd, dhp);
        },
        "OVERRIDE",
    );
}

function patch_getRestHitPointRecovery() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype._getRestHitPointRecovery",
        function patched_getRestHitPointRecovery(wrapped, ...args) {
            const currentHP = this.data.data.attributes.hp.value;
            const result = wrapped(...args);

            // Undo changes to hp from wrapped function
            result.updates["data.attributes.hp.value"] = currentHP;
            result.hitPointsRecovered = 0;
            return result;
        },
        "WRAPPER",
    );
}

function patch_getRestHitDiceRecovery() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype._getRestHitDiceRecovery",
        function patched_getRestHitDiceRecovery(wrapped, ...args) {
            const { maxHitDice=undefined } = args[0] ?? {};

            const recoveryHDMultiplier = 0;

            if (recoveryHDMultiplier === 0) return { updates: [], hitDiceRecovered: 0 };

            const recoveryHDRoundSetting = game.settings.get("ros-resting", "recovery-rounding");
            const recoveryHDRoundingFn = recoveryHDRoundSetting === "down" ? Math.floor : Math.ceil;

            const totalHitDice = this.data.data.details.level;
            const hitDiceToRecover = Math.clamped(recoveryHDRoundingFn(totalHitDice * recoveryHDMultiplier), 1, maxHitDice ?? totalHitDice);
            return wrapped({ maxHitDice: hitDiceToRecover });
        },
        "MIXED",
    );
}

function patch_getRestSpellRecovery() {
    libWrapper.register(
        "ros",
        "CONFIG.Actor.documentClass.prototype._getRestSpellRecovery",
        function patched_getRestSpellRecovery(wrapped, ...args) {
            const { recoverPact=true, recoverSpells=true } = args[0] ?? {};

            const spellsRecoveryMultiplier = 0;

            // Defer to the original method for recovering pact slots
            const results = wrapped({ recoverPact, recoverSpells: false });

            if (!recoverSpells || spellsRecoveryMultiplier === 0) return results;

            // But overwrite the logic for recovering other spell slots
            for ( let [k, v] of Object.entries(this.data.data.spells) ) {
                if (!v.override && !v.max) continue;
                let spellMax = v.override || v.max;
                let recoverSpells = Math.max(Math.floor(spellMax * spellsRecoveryMultiplier), 1);
                results[`data.spells.${k}.value`] = Math.min(v.value + recoverSpells, spellMax);
            }

            return results;
        },
        "WRAPPER",
    );
}

Hooks.on("init", async function () {
    console.log('ros | Initializing Ruins of Symbaroum DND5e module');
    
    // Prevent variant rest rules to appear as a world setting
    game.settings.register("dnd5e", "restVariant", {
        name: "SETTINGS.5eRestN",
        hint: "SETTINGS.5eRestL",
        scope: "world",
        config: false,
        default: "normal",
        type: String,
        choices: {
          normal: "SETTINGS.5eRestPHB",
          gritty: "SETTINGS.5eRestGritty",
          epic: "SETTINGS.5eRestEpic"
        }
      });


	// Patch DND5e resting functions to implement RoS rules
    patch_displayRestResultMessage();
    patch_newShortRest();
    patch_newLongRest();
    patch_getRestHitPointRecovery();
    patch_getRestHitDiceRecovery();
    patch_getRestSpellRecovery();

	// Remove standard DND5e languages and add RoS ones
	CONFIG.DND5E.languages = {
		"ambrian": "ROS.LanguagesAmbrian",
		"barbarian": "ROS.LanguagesBarbarian",
		"dwarvish": "ROS.LanguagesDwarvish",
		"doubletongue": "ROS.LanguagesDoubletongue",
		"elvish": "ROS.LanguagesElvish",
		"goblin": "ROS.LanguagesGoblin",
		"ignan": "ROS.LanguagesIgnan",
		"ogre": "ROS.LanguagesOgre",
		"symbaric": "ROS.LanguagesSymbaric",
		"tricklesting": "ROS.LanguagesTricklesting",
		"troll": "ROS.LanguagesTroll",
		"wolf-tongue": "ROS.LanguagesWolftongue"
	};
	
	CONFIG.DND5E.currencies = {
		gp: {
		  label: "ROS.CoinsGP",
		  abbreviation: "ROS.CoinsAbbrGP"
		},
		sp: {
		  label: "ROS.CoinsSP",
		  abbreviation: "ROS.CoinsAbbrSP",
		  conversion: {into: "gp", each: 10}
		},
		cp: {
		  label: "ROS.CoinsCC",
		  abbreviation: "ROS.CoinsAbbrCC",
		  conversion: {into: "sp", each: 10}
		}
	  };
  
	// Remove PP and EP from showing up on character sheet displays since we don't use them in RoS	
	const originalCGetData = game.dnd5e.applications.ActorSheet5eCharacter.prototype.getData;
	libWrapper.register(
		"ros",
		"game.dnd5e.applications.ActorSheet5eCharacter.prototype.getData",
		function patchedActorSheet5eCharacter(wrapped, ...args) {

		const data = originalCGetData.call(this);
		delete data.data.currency.pp;
		delete data.data.currency.ep;


		// Return data to the sheet
		return data
	}, "MIXED");

	// Remove PP and EP from showing up on vehicle sheet displays since we don't use them in AiME	
	const originalVGetData = game.dnd5e.applications.ActorSheet5eVehicle.prototype.getData;
	libWrapper.register(
		"ros",
		"game.dnd5e.applications.ActorSheet5eVehicle.prototype.getData",
		function patchedActorSheet5eCharacter(wrapped, ...args) {

		const data = originalVGetData.call(this);
		delete data.data.currency.pp;
		delete data.data.currency.ep;


		// Return data to the sheet
		return data
	}, "MIXED");

});

// Add the ensaring property option to weapons
Hooks.on("setup", async function () {
    
	CONFIG.DND5E.weaponProperties["ens"] = "Ensnaring";
});

// Change the text shown on the character sheet for various denominations to match RoS coinage
/* Hooks.on('renderActorSheet5eCharacter', (sheet, html) => {
    html.find('[class="denomination gp"]').text("TP");
    html.find('[class="denomination cp"]').text("OP");
});  */

// Prepopulate corruptions counters to character sheet using primary and secondary resources
Hooks.on("preCreateActor", (doc, createData, options, userId) => {
if(doc.data.type === "character"){
	doc.data.update({"data.resources.primary.label": "Temp/Perm Corruption"});
	doc.data.update({"data.resources.secondary.label": "Current/Threshold Corruption"});
	}
});

// Automate ensaring weapon critial proning feature
Hooks.on("midi-qol.DamageRollComplete", async function(arg) {
	if(arg.item.type !== "weapon") return;
    if(!arg.item.data.data.properties.ens || !arg.isCritical) return; 
    //game.cub.addCondition("Prone", Array.from(arg.hitTargets)[0])
	game.dfreds.effectInterface.addEffect('Prone', Array.from(arg.targets)[0].document.uuid);
	//arg.targets.forEach(uuid => game.dfreds.effectInterface.addEffect('Prone', document.uuid));
});

// Automate homebrew lingering injuries rule by damage type TODO: remove from module and move somewhere else
Hooks.on("midi-qol.DamageRollComplete", async function(arg) {
	if(!arg.isCritical) return;
	let pack = game.packs.get("ros-content.ros-roll-tables");
	let dmgType = arg.damageDetail[0].type
	let tableId = pack.index.find(i => i.name.includes(capitalizeFirstLetter(dmgType)))._id;
	let table = await pack.getDocument(tableId);
	table.draw();
});

// Automate spell temporary corruption cost calculations
Hooks.on("midi-qol.RollComplete", async function(arg) {
	if(arg.item?.data.type !== "spell") return;
	let spellName = arg.item.data.name;
	let spellLevel = arg.item.data.data.level;
	let isPrepared = arg.item.data.data.preparation.prepared;
	let prepMode = arg.item.data.data.preparation.mode
	var spellCorr = spellLevel + 1;

	if(!isPrepared && spellLevel !== 0 && prepMode !== "atwill"){
		const roll = new Roll(`1d4`);
		var spellCorr = spellLevel + roll.roll().total;

		roll.toMessage({
			flavor: `Spell Corruption Roll`
		});
	};

	if(spellLevel === 0){
		if (isPrepared) {
			var spellCorr = 0;
		} else {
			var spellCorr = 1;
		}
	};

	if(prepMode === "atwill"){
		var spellCorr = 0;
	}

	arg.actor.update({
        "data.resources.primary.value":
		arg.actor.data.data.resources.primary.value + spellCorr,
        "data.resources.secondary.value": 
		arg.actor.data.data.resources.secondary.value + spellCorr
	});

    let message = "ROS.CorruptionGain";
    let chatData = {
        user: game.user.id,
        speaker: {actor: arg.actor, alias: arg.actor.name},
        //flavor: game.i18n.localize(restFlavor),
        content: game.i18n.format(message, {
          name: arg.actor.name,
          spellName: spellName,
          spellCorr: spellCorr
        })
      };
    ChatMessage.create(chatData)

//	let newContent = `<p><b>Corruption Gained</b></p>You have gained <b>${spellCorr} Temporary Corruption</b> by casting <b>${spellName}</b>`;
//	ChatMessage.create({ user: game.user._id, content: newContent, type: CONST.CHAT_MESSAGE_TYPES.OTHER});
    ui.notifications.warn(game.i18n.format(message, {
          name: arg.actor.name,
          spellName: spellName,
          spellCorr: spellCorr
        }));

});

// Automate checks for marks of corruption
Hooks.on("preUpdateActor", async (doc, updateData, options, userId) => {
	if(!updateData.data?.resources?.primary) return;
/* 	var tempCorr = doc.data.data.resources.primary.value;
	var permCorr = doc.data.data.resources.primary.max;
    if(updateData.data.resources.primary.value !== undefined ) var tempCorr = updateData.data.resources.primary.value;
	if(updateData.data.resources.primary.max !== undefined ) var permCorr = updateData.data.resources.primary.max; */
    var tempCorr = (updateData.data.resources.primary.value == undefined ) ? doc.data.data.resources.primary.value : updateData.data.resources.primary.value;
    var permCorr = (updateData.data.resources.primary.max == undefined ) ? doc.data.data.resources.primary.max : updateData.data.resources.primary.max;
	var totalCorr = tempCorr + permCorr;
	setProperty(updateData, "data.resources.secondary.value", totalCorr);
	// Only check for threshold is temp corruption went up
	if(updateData.data.resources.primary.value < doc.data.data.resources.primary.value ) return;
	// Corruption threshold check 
	var threshold = doc.data.data.resources.secondary.max;
	if(totalCorr > threshold){
		let diffCorr = totalCorr - threshold;
		let rollCorr = new Roll(`1d20cs>${diffCorr}`).roll();
		game.dice3d?.showForRoll(rollCorr);
		let dice_roll = rollCorr.dice[0].results;
		let get_dice = "";
		for (let dice of dice_roll){
			if (dice.result > diffCorr){
				get_dice += `<li class="roll die d20 success">${dice.result}</li>`; }
			else {  get_dice += `<li class="roll die d20 failure">${dice.result}</li>`; }
		}
		let success = dice_roll[0].success ? " critical" : " fumble";
	   	let the_content = `<div class="chat-card item-card"><div class="card-content">Dice Roll</div><div class="card-buttons"><div class="flexrow 1"><div><b>Corruption Check</b><p>Current corruption above threshold by ${diffCorr}</p><div class="dice-roll"><div class="dice-result"><div class="dice-formula">1d20</div><div class="dice-tooltip"><div class="dice"><ol class="dice-rolls">${get_dice}</ol></div></div><h4 class="dice-total${success}"></h4></div></div></div></div></div></div>`;
		ChatMessage.create({ user: game.user._id, content: the_content, type: CONST.CHAT_MESSAGE_TYPES.OTHER});
		if(!dice_roll[0].success){
		let pack = game.packs.get("ros-content.ros-roll-tables");
		let tableId = pack.index.find(i => i.name === "Mark of Corruption")._id;
		let table = await pack.getDocument(tableId);
		table.draw();
		}
	}
});

// Hack to disable unckeck the spell slot box on spell casting dialogs since we don't use slots TODO: just don't show it
Hooks.on("renderAbilityUseDialog", function (dialog) {
    if (!dialog.hasOwnProperty("item")) return;
    if (dialog.item.data.type === "spell") {
        $('input[name="consumeSlot"]').removeAttr("checked");
    }
});



Hooks.on('renderActorSheet', async function (app, html, data) {
	const sheet5e = app.options.classes.join();
	const sheetTidy = app.options.classes[0];
	const sheetTidyType = app.options.classes[3];
        // Tidy5e Sheet Compatibility
        if (sheetTidy === "tidy5e") {
			/* const livingBox = "/modules/ros/templates/aime-tidy5e-standard.hbs"
			const livingHtml = await renderTemplate(livingBox, data);
			const tidyMisBox = "/modules/ros/templates/aime-tidy5e-miserable.hbs"
			const tidyMisHtml = await renderTemplate(tidyMisBox, data); */
			const tidyGP = "/modules/ros/templates/ros-tidy5e-gp.hbs"
			const tidyGPRender =  await renderTemplate(tidyGP, data);
			const tidySP = "/modules/ros/templates/ros-tidy5e-sp.hbs"
			const tidySPRender =  await renderTemplate(tidySP, data);
			const tidyCP = "/modules/ros/templates/ros-tidy5e-cp.hbs"
			const tidyCPRender =  await renderTemplate(tidyCP, data);
/* 			var tidyAlignment = $(html).find('[data-target*="alignment"]');
			var tidyAlignmentInput = $(html).find('input[name="data.details.alignment"]')[0];
			var tidyBackground = $(html).find('[data-target*="background"]');
			var tidyInspiration = $(html).find('.inspiration'); */

			// Remove alignment and insert standard of living
/* 			if (sheetTidyType != "vehicle") {
			tidyAlignment.remove();
			tidyAlignmentInput.remove();
			} */
			// If NPC or Vehicle remove Shadow and Perm scores
/* 			if (sheetTidyType != "character") {
			var npcSha = $(html).find('[data-ability="sha"]');
    		var npcPerm = $(html).find('[data-ability="perm"]');
        	npcSha.remove();
        	npcPerm.remove();
			} */
			if (sheetTidyType === "character") {
/* 			tidyBackground.after(livingHtml);

			// Remove mod/save box from new scores
			var tidySha = $(html).find('[data-ability="sha"]').find('.value-footer');
			var tidyPerm = $(html).find('[data-ability="perm"]').find('.value-footer');
			tidySha.remove();
			tidyPerm.remove();

			// Add Miserable button next to Inspiration button
			tidyInspiration.after(tidyMisHtml);

			// Remove spellbook tab
			$(html).find('[data-tab="spellbook"]').remove()	 */

			// Change currency abbreviations
			var tidyGPReplace = $(html).find('.denomination.gp')[0];
			tidyGPReplace.innerHTML = tidyGPRender;
			var tidySPReplace = $(html).find('.denomination.sp')[0];
			tidySPReplace.innerHTML = tidySPRender;
			var tidyCPReplace = $(html).find('.denomination.cp')[0];
			tidyCPReplace.innerHTML = tidyCPRender;
			}
        }
    });
