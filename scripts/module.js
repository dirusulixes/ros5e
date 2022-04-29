import { DND5E } from './../../../systems/dnd5e/module/config.js';

function capitalizeFirstLetter(str) {
	return str[0].toUpperCase() + str.slice(1);
};


Hooks.on("init", async function () {
    console.log('ros5e | Initializing Ruins of Symbaroum 5e - Automations and Styling Module');
    
    // Prevent variant rest rules to appear as a world setting
/*     game.settings.register("dnd5e", "restVariant", {
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
      }); */


	// Remove standard DND5e languages and add RoS ones
	CONFIG.DND5E.languages = {
		ambrian: "ROS5E.LanguagesAmbrian",
		barbarian: "ROS5E.LanguagesBarbarian",
		dwarvish: "ROS5E.LanguagesDwarvish",
		doubletongue: "ROS5E.LanguagesDoubletongue",
		elvish: "ROS5E.LanguagesElvish",
		goblin: "ROS5E.LanguagesGoblin",
		ignan: "ROS5E.LanguagesIgnan",
		ogre: "ROS5E.LanguagesOgre",
		symbaric: "ROS5E.LanguagesSymbaric",
		tricklesting: "ROS5E.LanguagesTricklesting",
		troll: "ROS5E.LanguagesTroll",
		wolftongue: "ROS5E.LanguagesWolftongue"
	};
	
});

// Automate ensaring weapon critial proning feature
Hooks.on("midi-qol.DamageRollComplete", async function (workflow) {
	if (!workflow.item?.hasDamage || workflow.hitTargets.size === 0) return;
    if(!workflow.item.data.data.properties.ens || !workflow.isCritical) return; 
	for (let target of workflow.damageList) {
		const token = await fromUuid(target.tokenUuid)
		await game.dfreds.effectInterface.addEffect({ effectName: "Prone", uuid: token }); 
	
	}
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