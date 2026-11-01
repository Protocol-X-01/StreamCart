import{createApp}from'./app.js';import{config}from'./config.js';createApp().listen(config.PORT,()=>console.log(`StreamCart API :${config.PORT}`));
