export const THEMES = [
  {
    name: '果园甜品站', station: '果园订单', title: '被果汁染花的订单',
    clue: '一颗红红的心，一串紫色的小圆球。同锅熬成冒爱心的果酱，再抹上金黄吐司。',
    kind: 'fruit',
    success: '爱心果酱抹上吐司，染花的订单终于完整啦。',
    floor: ['#eff6e8', '#dbeace'], wall: '#c6e3dc', counter: '#77aaa0', top: '#fff3cc', accent: '#d67d83',
  },
  {
    name: '口袋便当铺', station: '便当打包台', title: '给出门的你，带一份惦记',
    clue: '米饭煮好、鸡肉烤好、西兰花切好，一起装盘端到打包台。盖上盒盖，套好绑带，贴上爱心封签，再从取餐口交给你。',
    kind: 'bento',
    success: '便当交到你手里啦。出门也要好好吃饭，今天的惦记一起带上。',
    floor: ['#f7edf0', '#e4dee9'], wall: '#f0c9d2', counter: '#a398be', top: '#fff7e8', accent: '#ce788b',
  },
  {
    name: '深夜卤味档', station: '卤料袋', title: '少了字的卤料方',
    clue: '像星星一样的香料、卷成小木筒的香料、一片叶子。今晚不要辣，三样就够。逐味装袋，配好后把袋子放进锅里。',
    kind: 'spice', options: ['anise', 'cinnamon', 'bay', 'chili'], answer: ['anise', 'cinnamon', 'bay'],
    success: '八角、桂皮、香叶入锅，今晚的温柔卤汤准备好啦。',
    floor: ['#dce4e9', '#cbd7df'], wall: '#425969', counter: '#68999d', top: '#f3e6cd', accent: '#e8ad65',
  },
  {
    name: '时光食堂', station: '回忆相片', title: '为这一餐拍张照',
    clue: '旧照片里，有番茄热汤、金黄吐司和切好的蘑菇。把这一餐端到双人餐桌，让两套餐具一起入镜，留下一张清晰的新照片。',
    kind: 'memory',
    success: '今天的晚餐，也成为了我们的一张回忆。',
    floor: ['#e7f0f1', '#d5e2e5'], wall: '#bbd8de', counter: '#86a7b2', top: '#faf0dc', accent: '#d98279',
  },
  {
    name: '月光香草厨房', station: '雾气玻璃', title: '热茶留下的一句话',
    clue: '玻璃上似乎藏着字。端一杯煮好的食用薄荷茶靠近它，让热气停留片刻。',
    kind: 'steam', success: '灯旁一杯热茶，花下一盘面包。今晚，陪你慢下来。',
    floor: ['#e5e5ee', '#d2d7e5'], wall: '#5c6787', counter: '#9299bb', top: '#f5eddb', accent: '#d5b567',
  },
  {
    name: '只为你营业的花园餐厅', station: '花园餐序', title: '今晚的最后一道特别菜单',
    clue: '前奏是清新的绿色，主调是热乎乎的烤肉，尾声留一口红色的甜。让三份味道依次入席。',
    kind: 'finale', order: ['broccoli', 'beef', 'strawberry'],
    success: '前奏、主调、尾声，都为你入席。今晚的花园亮起来啦。',
    floor: ['#e7eedf', '#d3dfd1'], wall: '#a6cbbb', counter: '#86aa91', top: '#f8e8e9', accent: '#ce809b',
  },
];

export const SPICES = {
  anise: { name: '八角', symbol: 'star' },
  cinnamon: { name: '桂皮', symbol: 'logs' },
  bay: { name: '香叶', symbol: 'leaf' },
  chili: { name: '辣椒', symbol: 'flame' },
};
export const STEAM_MESSAGE = '热茶留在灯旁，面包放在花下。';
