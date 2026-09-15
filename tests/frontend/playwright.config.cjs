const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.', testMatch: '*.spec.cjs', timeout: 30000,
  use: {baseURL:'http://127.0.0.1:8000', serviceWorkers:'block', trace:'retain-on-failure'},
  projects: [
    {name:'desktop-1440',use:{viewport:{width:1440,height:900}}},
    {name:'tablet-768',use:{viewport:{width:768,height:1024},hasTouch:true}},
    {name:'mobile-414',use:{viewport:{width:414,height:896},isMobile:true,hasTouch:true}},
    {name:'mobile-360',use:{viewport:{width:360,height:800},isMobile:true,hasTouch:true}}
  ],
  webServer:{command:'python ../../tools/serve_site_qa.py --root ../../_site',url:'http://127.0.0.1:8000',reuseExistingServer:false},
  reporter:[['list'],['html',{open:'never'}]]
});
