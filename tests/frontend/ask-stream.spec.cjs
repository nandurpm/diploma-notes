const { test, expect } = require('@playwright/test');
const answer = 'Hindu traditions in Japan have a long history of cultural exchange.';
for (const complete of [false,true]) {
  test(`${complete?'completed':'interrupted'} streamed answer survives chat reload`,async({page})=>{
    await page.route('https://**/*',route=>{
      const request=route.request();
      if(request.method()==='POST' && request.url().includes('/api/ask-poly')) {
        const body=`data: ${JSON.stringify({delta:{content:answer}})}\n\n${complete?'data: [DONE]\n\n':''}`;
        return route.fulfill({status:200,contentType:'text/event-stream',headers:{'access-control-allow-origin':'*'},body});
      }
      if(request.url().includes('/health')) return route.fulfill({json:{ok:true,configured:true,providers:['test']},headers:{'access-control-allow-origin':'*'}});
      return route.abort();
    });
    await page.goto('/ask-poly.html');
    await expect(page.locator('#chatTitle')).not.toHaveText('Ask POLY Chat');
    await page.locator('#chatInput').fill('Write an essay about Hindu temples in Japan');
    await page.getByRole('button',{name:'Send',exact:true}).click();
    const saved=page.locator('#chatMessages .ask-bubble.ai:not(#streamingAnswerBubble)');
    await expect(saved).toContainText(answer);
    await expect(page.locator('#stopBtn')).toBeHidden();
    if(!complete) {
      await expect(saved.locator('.ask-answer-notice')).toContainText('incomplete and has been saved');
      await expect(saved.getByRole('button',{name:'Retry question'})).toBeVisible();
    } else await expect(saved.locator('.ask-answer-notice')).toHaveCount(0);
    await expect(saved).not.toContainText('I could not reach the AI service');
    await page.reload();
    await expect(saved).toContainText(answer);
    await expect(saved.locator('.ask-answer-notice')).toHaveCount(complete?0:1);
  });
}
