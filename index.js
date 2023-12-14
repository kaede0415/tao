const http = require('http')
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const moment = require('moment');
const express = require('express');
const app = express();
const fs = require('fs');
const axios = require('axios');
const util = require('util');
const path = require('path');
const cron = require('node-cron');
const Keyv = require('keyv');
const db = new Keyv(`sqlite://guild.sqlite`, { table: "settings" });
const client = new Client({
  partials: ["CHANNEL"],
  intents: new Intents(32767)
});
const { Modal, TextInputComponent, SelectMenuComponent, showModal } = require("discord-modals");
const discordModals = require('discord-modals');
discordModals(client);
const newbutton = (buttondata) => {
  return {
    components: buttondata.map((data) => {
      return {
        custom_id: data.id,
        label: data.label,
        style: data.style || 1,
        url: data.url,
        emoji: data.emoji,
        disabled: data.disabled,
        type: 2,
      };
    }),
    type: 1,
  };
};
process.env.TZ = 'Asia/Tokyo'
"use strict";
let guildId

const commands = {}
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))

http
  .createServer(function(request, response) {
    response.writeHead(200, { 'Content-Type': 'text/plain;charset=utf-8' })
    response.end(`${client.user.tag} is ready!\n導入サーバー:${client.guilds.cache.size}\nユーザー:${client.users.cache.size}`)
  })
  .listen(3000)

for(const file of commandFiles){
  const command = require(`./commands/${file}`);
  commands[command.data.name] = command
}

if (process.env.DISCORD_BOT_TOKEN == undefined) {
  console.error('tokenが設定されていません！')
  process.exit(0)
}

client.on('ready', async () => {
  client.user.setActivity(`${client.guilds.cache.size}guilds | ${client.users.cache.size}members`, {
    type: 'PLAYING'
  });
  const embed = new MessageEmbed()
  .setTitle("起動しました！")
  .setDescription(">>> ```diff\n+ Hello World!　　　　　``````diff\n+ 導入サーバー数:" + client.guilds.cache.size + "\n+ ユーザー数:" + client.users.cache.size + "```" + moment().format("YYYY-MM-DD HH:mm:ss"))
  .setThumbnail(client.user.displayAvatarURL())
  .setColor("RANDOM")
  client.channels.cache.get("1183460380119421048").send({ embeds: [ embed ] })
  const data = []
  for(const commandName in commands){
    data.push(commands[commandName].data)
  }
  await client.application.commands.set(data);
  client.user.setStatus("idle");
  console.log(`${client.user.tag} is ready!`);
});

client.on("messageCreate", async message => {
  if(message.author.id != "526620171658330112") return
  const receivedEmbed = message.embeds[0]
  const data = await db.get(message.guild.id)
  if(receivedEmbed && receivedEmbed.title && receivedEmbed.title.match(/待ち構えている...！/) && receivedEmbed.author){
    const zokusei = receivedEmbed.author.name.match(/\[(.*?)\]/g)[0]
    const rank = `【${receivedEmbed.author.name.split(":")[2].replace(" ","")}】`
    const name = receivedEmbed.title.split("\n")[0].replace("が待ち構えている...！","")
    const lv = receivedEmbed.title.split("\n")[1].replaceAll(",","").match(/^\D+(\d+)\D+(\d+)\D+(\d+)$/)[1]
    const image = receivedEmbed.image.url || undefined
    const attribute = receivedEmbed.author.iconURL
    //通知機構
    if(receivedEmbed.author && receivedEmbed.author.name.match(/: 通常/)){
      
    }
    //自動変更
    if(message.channel.topic == "none-auto:100"){
      const level = Math.floor(Number(lv) / 100) * 100
      if(message.channel.name.match(/lv+\d+$/)){
        const n = message.channel.name.match(/lv+(\d+)$/)
        if(n[1] == level){
          return;
        }
        const name = message.channel.name.replace(/lv+\d+$/,`lv${level}`)
        await message.channel.setName(name)
        return;
      }
      await message.channel.setName(`${message.channel.name}-lv${level}`)
    }else if(message.channel.topic == "none-auto:1000"){
      const level = Math.floor(Number(lv) / 1000) * 1000
      if(message.channel.name.match(/lv+\d+$/)){
        const n = message.channel.name.match(/lv+(\d+)$/)
        if(n[1] == level){
          return;
        }
        const name = message.channel.name.replace(/lv+\d+$/,`lv${level}`)
        await message.channel.setName(name)
        return;
      }
      await message.channel.setName(`${message.channel.name}-lv${level}`)
    }else if(message.channel.topic == "none-auto:10000"){
      const level = Math.floor(Number(lv) / 10000) * 10000
      if(message.channel.name.match(/lv+\d+$/)){
        const n = message.channel.name.match(/lv+(\d+)$/)
        if(n[1] == level){
          return;
        }
        const name = message.channel.name.replace(/lv+\d+$/,`lv${level}`)
        await message.channel.setName(name)
        return;
      }
      await message.channel.setName(`${message.channel.name}-lv${level}`)
    }
  }
  //P厳選
})

client.on("interactionCreate", async interaction => {
  if(!interaction.isButton()){
    return;
  }
})

client.on("interactionCreate", async (interaction) => {
  if(!interaction.isCommand()){
    return;
  }
  const command = commands[interaction.commandName];
  try{
    await command.execute(interaction);
  }catch(error){
    console.error(error);
    await interaction.reply({
      content: '何らかのエラーが発生しました。\n管理者にお伝え下さい。',
      ephemeral: true,
    })
  }
});

client.on('modalSubmit', async interaction => {
  if(interaction.customId.startsWith("vending-")){
    const [number,quantity,paypay] = ['number','quantity','paypay']
		.map(id => interaction.getTextInputValue(id));
    let link
    const value = paypay.split(/\r\n|\n/g)
    for(let i in value){
      if(value[i].match(/^https?:\/\/[^   ]/i)){
        link = value[i]
      }
    }
    if(link == undefined) return interaction.reply({ content: "PayPayの送金リンクが検出されませんでした", ephemeral: true })
    const category = interaction.customId.split("-")[1]
    const role = interaction.customId.split("-")[2]
    const numbers = interaction.customId.split("-")[3].split("/")
    if(!numbers.includes(number)) return interaction.reply({ content: "登録されていない商品番号です", ephemeral: true })
    let newChannel
    if(category == "undefined"){
      newChannel = await interaction.guild.channels.create(`🎫-${interaction.user.username}`, {
        type: 'GUILD_TEXT',
        topic: interaction.user.id,
      });
    }else{
      newChannel = await interaction.guild.channels.create(`🎫-${interaction.user.username}`, {
        type: 'GUILD_TEXT',
        parent: category,
        topic: interaction.user.id,
      });
    }
    await newChannel.permissionOverwrites.create(interaction.user.id, {
      VIEW_CHANNEL: true,
    });
    await newChannel.permissionOverwrites.create(interaction.guild.roles.everyone, {
      VIEW_CHANNEL: false,
    });
    interaction.reply({ content: `${newChannel.toString()}を作成しました。`, ephemeral: true })
    const info_embed = new MessageEmbed()
    .setTitle("スタッフの対応をお待ち下さい。")
    .addField("商品番号:",`>>> ${number}`)
    .addField("個数:",`>>> ${quantity}`)
    .addField("送金リンク:",`>>> ${link}`)
    .setColor("RANDOM")
    const del_embed = new MessageEmbed()
    .setDescription("チケットを削除したい場合は下のボタンを押してください")
    .setColor("RANDOM")
    newChannel.send({ content: `<@${interaction.user.id}>`, embeds: [ info_embed, del_embed ], components: [ newbutton([ { "id": "delete", label: "チケットを削除", style: "DANGER" } ]) ] })
    if(role != "undefined"){
      const msg = await newChannel.send(`<@&${role.toString()}>`)
      setTimeout(function(){
        msg.delete()
      },3000)
    }
  }
});

client.on('error', (err) => {
  console.error("error")
})

client.login(process.env.DISCORD_BOT_TOKEN)
