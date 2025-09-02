// 直接使用全局变量 window.vocabularyList
// 确保在HTML中先加载vocabulary.js，再加载app.js

let currentWords = [];
const numCards = 10;
// 存储错误单词的对象，格式: {wordId: {word: {...}, errorCount: number}}
let errorWords = {};

// 从localStorage加载错误单词
function loadErrorWords() {
  const saved = localStorage.getItem('errorWords');
  if (saved) {
    try {
      errorWords = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load error words:', e);
      errorWords = {};
    }
  }
}

// 保存错误单词到localStorage
function saveErrorWords() {
  try {
    localStorage.setItem('errorWords', JSON.stringify(errorWords));
  } catch (e) {
    console.error('Failed to save error words:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadErrorWords();
  initializeGame();
  setupEvents();
});

function initializeGame() {
  const mode = document.getElementById('mode-selector').value;
  const categorySelector = document.getElementById('category-selector');
  
  // 确保阅读模式下类别选择器是启用的
  if (mode === 'reading') {
    categorySelector.disabled = false;
  }
  
  // 根据模式获取单词
  if (mode === 'reading') {
    // 阅读模式下，我们直接调用getRandomWords来获取文章数据
    currentWords = getRandomWords(0); // 0表示不限制数量
  } else {
    currentWords = getRandomWords(numCards);
  }
  
  renderCards(currentWords);
  document.getElementById('result-container').innerHTML = '';

  // 如果是复习模式且没有错误单词，显示提示
  if (mode === 'review' && currentWords.length === 0) {
    const cardsContainer = document.getElementById('cards-container');
    cardsContainer.innerHTML = `
      <div class="no-error-words">
        <h3>恭喜！没有需要复习的单词</h3>
        <p>你已经掌握了所有单词，继续保持！</p>
        <p>可以尝试其他模式进行练习。</p>
      </div>
    `;
  }
}

function setupEvents() {
  document.getElementById('mode-selector').addEventListener('change', function() {
    const categorySelector = document.getElementById('category-selector');
    if (this.value === 'category' || this.value === 'dictation' || this.value === 'review' || this.value === 'listening' || this.value === 'wordlist' || this.value === 'word-to-chinese' || this.value === 'reading') {
      categorySelector.disabled = false;
    } else {
      categorySelector.disabled = true;
    }
    
    // 控制按钮显示和隐藏
    const isReadingMode = this.value === 'reading';
    document.getElementById('new-game-btn').style.display = isReadingMode ? 'none' : 'inline-block';
    document.getElementById('show-all-btn').style.display = isReadingMode ? 'none' : 'inline-block';
    document.getElementById('submit-btn').style.display = isReadingMode ? 'none' : 'inline-block';
    document.getElementById('reset-btn').style.display = isReadingMode ? 'none' : 'inline-block';
    
    initializeGame();
  });

  document.getElementById('category-selector').addEventListener('change', initializeGame);
  document.getElementById('new-game-btn').addEventListener('click', initializeGame);
  document.getElementById('show-all-btn').addEventListener('click', () =>
    document.querySelectorAll('.correct-answer').forEach(e => e.style.display = 'block')
  );
  document.getElementById('submit-btn').addEventListener('click', checkAnswers);
  document.getElementById('reset-btn').addEventListener('click', () =>
    document.querySelectorAll('.answer-input').forEach(i => {
      i.value = '';
      i.classList.remove('correct-input', 'wrong-input');
    })
  );
  
  // 确保页面加载时按钮状态正确
  const modeSelector = document.getElementById('mode-selector');
  const isReadingMode = modeSelector.value === 'reading';
  document.getElementById('new-game-btn').style.display = isReadingMode ? 'none' : 'inline-block';
  document.getElementById('show-all-btn').style.display = isReadingMode ? 'none' : 'inline-block';
  document.getElementById('submit-btn').style.display = isReadingMode ? 'none' : 'inline-block';
  document.getElementById('reset-btn').style.display = isReadingMode ? 'none' : 'inline-block';
}

function getRandomWords(count) {
  const mode = document.getElementById('mode-selector').value;
  let filteredWords = window.vocabularyList;

  if (mode === 'category') {
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  } else if (mode === 'listening') {
    // 听音选单词模式下，我们根据类别筛选单词
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  } else if (mode === 'dictation') {
    // 听写模式下，我们根据类别筛选单词
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  } else if (mode === 'reading') {
    // 阅读模式下，我们返回文章数据
    const category = document.getElementById('category-selector').value;
    return getReadingArticles(category);
  } else if (mode === 'review') {
    // 复习模式下，我们使用错误单词
    const category = document.getElementById('category-selector').value;
    let errorWordsList = Object.values(errorWords).map(item => item.word);

    // 根据类别筛选错误单词
    if (category !== 'all') {
      errorWordsList = errorWordsList.filter(word => word.category === category);
    }

    if (errorWordsList.length > 0) {
      filteredWords = errorWordsList;
    } else {
      // 如果没有错误单词，显示提示
      filteredWords = [];
    }
  } else if (mode === 'wordlist') {
    // 单词表模式下，我们根据类别筛选单词但不随机选择
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
    // 按字母顺序排序
    filteredWords = filteredWords.sort((a, b) => a.english.localeCompare(b.english));
    return filteredWords;
  } else if (mode === 'word-to-chinese') {
    // 看单词选中文模式下，我们根据类别筛选单词
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  }

  // 如果筛选后的单词数量不足，并且用户没有明确选择类别，才使用所有单词（复习模式和单词表模式除外）
  const category = document.getElementById('category-selector').value;
  if (filteredWords.length < count && mode !== 'review' && mode !== 'wordlist' && category === 'all') {
    filteredWords = window.vocabularyList;
  }

  // 对于复习模式，如果没有错误单词，返回空数组
  if (mode === 'review' && filteredWords.length === 0) {
    return [];
  }

  // 对于单词表模式，返回所有筛选后的单词
  if (mode === 'wordlist') {
    return filteredWords;
  }

  return [...filteredWords].sort(() => 0.5 - Math.random()).slice(0, count);
}

// 获取单词图片路径的函数
function getWordImagePath(chinese, category) {
  // 图片路径格式：/图库/类别名称/中文名称.png
  const categoryMap = {
    'animal': '动物类',
    'food': '食物类',
    'daily': '日常用品类',
    'color': '颜色类',
    'number': '数字类',
    'fruit': '水果类',
    'transport': '交通工具类',
    'body': '身体部位类',
    'family': '亲属类',
    'weather': '天气类',
    'action': '动作类',
    'emotion': '情感类'
  };
  
  const categoryName = categoryMap[category] || category;
  // 使用中文名称作为图片文件名
  return `图库/${categoryName}/${chinese}.png`;
}

// 图片加载失败处理函数
function handleImageError(event) {
  try {
    const img = event.target || this;
    if (!img) {
      console.warn('Image element is undefined in handleImageError');
      return;
    }
    
    // 确保获取到wordName的健壮性
    let wordName = '未知单词';
    try {
      wordName = img.alt || img.dataset?.word || img.title || img.getAttribute?.('data-title') || '未知单词';
      // 如果wordName为空字符串，设置为'未知单词'
      if (!wordName || wordName.trim() === '') {
        wordName = '未知单词';
      }
    } catch (e) {
      wordName = '未知单词';
    }
    
    // 确保获取到imgSrc的健壮性
    const imgSrc = img.src || '';
    
    // 确定图片类别
    let category = 'other';
    try {
      if (img.classList?.contains('category-animal') || imgSrc.includes('动物类')) {
        category = 'animal';
      } else if (imgSrc.includes('食物类') || img.classList?.contains('category-food')) {
        category = 'food';
      } else if (imgSrc.includes('水果类') || img.classList?.contains('category-fruit')) {
        category = 'fruit';
      } else if (imgSrc.includes('日常用品类') || img.classList?.contains('category-daily')) {
        category = 'daily';
      } else if (imgSrc.includes('颜色类') || img.classList?.contains('category-color')) {
        category = 'color';
      } else if (imgSrc.includes('数字类') || img.classList?.contains('category-number')) {
        category = 'number';
      } else if (imgSrc.includes('交通工具类') || img.classList?.contains('category-transport')) {
        category = 'transport';
      } else if (imgSrc.includes('身体部位类') || img.classList?.contains('category-body')) {
        category = 'body';
      } else if (imgSrc.includes('亲属类') || img.classList?.contains('category-family')) {
        category = 'family';
      } else if (imgSrc.includes('天气类') || img.classList?.contains('category-weather')) {
        category = 'weather';
      } else if (imgSrc.includes('动作类') || img.classList?.contains('category-action')) {
        category = 'action';
      } else if (imgSrc.includes('情感类') || img.classList?.contains('category-emotion')) {
        category = 'emotion';
      }
    } catch (e) {
      category = 'other';
    }
    
    // 所有类别的emoji映射表
    const categoryEmojis = {
      'animal': {
        '企鹅': '🐧', '猴子': '🐵', '大象': '🐘', '狮子': '🦁', '老虎': '🐯', 
        '熊猫': '🐼', '熊': '🐻', '长颈鹿': '🦒', '斑马': '🦓', '河马': '🦛',
        '犀牛': '🦏', '鳄鱼': '🐊', '蛇': '🐍', '蜥蜴': '🦎', '青蛙': '🐸',
        '海龟': '🐢', '鸟': '🐦', '鸽子': '🕊️', '猫头鹰': '🦉', '鹦鹉': '🦜',
        '孔雀': '🦚', '鸭子': '🦆', '鹅': '🦢', '鸡': '🐔', '火烈鸟': '🦩',
        '企鹅': '🐧', '鱼': '🐟', '海豚': '🐬', '鲸鱼': '🐳', '鲨鱼': '🦈',
        '螃蟹': '🦀', '龙虾': '🦞', '章鱼': '🐙', '贝壳': '🐚', '蝴蝶': '🦋', // 蝴蝶
        '蜜蜂': '🐝', '蚂蚁': '🐜', '蜘蛛': '🕷️', '苍蝇': '🪰', '蚊子': '🦟',
        '蟑螂': '🪳', '小鸟': '🐦', '猫': '🐱', '狗': '🐶', '兔子': '🐰',
        '老鼠': '🐭', '仓鼠': '🐹', '猪': '🐷', '牛': '🐮', '羊': '🐏',
        '马': '🐴', '鹿': '🦌'
      },
      'food': {
        '米饭': '🍚', '面条': '🍜', '面包': '🍞', '蛋糕': '🎂', '饼干': '🍪',
        '糖果': '🍬', '巧克力': '🍫', '冰淇淋': '🍦', '奶酪': '🧀', '鸡蛋': '🥚',
        '牛奶': '🥛', '咖啡': '☕', '茶': '🍵', '果汁': '🍹', '可乐': '🥤',
        '水': '💧', '汤': '🍲', '沙拉': '🥗', '三明治': '🥪', '汉堡': '🍔',
        '披萨': '🍕', '热狗': '🌭', '炸鸡': '🍗', '牛排': '🥩', '鱼肉': '🐟',
        '蔬菜': '🥬', '水果': '🍎', '坚果': '🌰', '番茄酱': '🍅', '酱油': '🧂',
        '盐': '🧂', '糖': '🍬', '油': '🫙'
      },
      'fruit': {
        '苹果': '🍎', '香蕉': '🍌', '橙子': '🍊', '梨': '🍐', '葡萄': '🍇',
        '草莓': '🍓', '蓝莓': '🫐', '桃子': '🍑', '樱桃': '🍒', '西瓜': '🍉',
        '哈密瓜': '🍈', '芒果': '🥭', '菠萝': '🍍', '猕猴桃': '🥝', '柠檬': '🍋',
        '椰子': '🥥', '石榴': '🍅', '荔枝': '🍓', '龙眼': '🍓', '柿子': '🍅'
      },
      'daily': {
        '书包': '🎒', '铅笔': '✏️', '钢笔': '🖊️', '书': '📚', '笔记本': '📓',
        '纸': '📄', '橡皮': '🧽', '尺子': '📏', '圆规': '📐', '剪刀': '✂️',
        '胶水': '🩹', '胶带': '🧻', '杯子': '🥤', '盘子': '🍽️', '碗': '🥣',
        '勺子': '🥄', '叉子': '🍴', '刀': '🔪', '筷子': '🥢', '锅': '🍳',
        '盘子': '🍽️', '杯子': '🥤', '牙刷': '🪥', '牙膏': '🧴', '毛巾': '🧼',
        '肥皂': '🧼', '洗发水': '🧴', '沐浴露': '🧴', '衣服': '👕', '裤子': '👖',
        '鞋子': '👟', '帽子': '🧢', '袜子': '🧦', '手套': '🧤', '围巾': '🧣',
        '雨伞': '☂️', '钟表': '⏰', '眼镜': '👓', '手机': '📱', '电脑': '💻',
        '电视': '📺', '冰箱': '🧊', '洗衣机': '🧺', '吹风机': '💨', '镜子': '🪞'
      },
      'color': {"red":"🔴", "blue":"🔵", "green":"🟢", "yellow":"🟡", "purple":"🟣",
        '红色': '🔴', '蓝色': '🔵', '绿色': '🟢', '黄色': '🟡', '紫色': '🟣',
        '橙色': '🟠', '黑色': '⚫', '白色': '⚪', '灰色': '🔘', '粉色': '💖',
        '棕色': '🟤', '金色': '🟡', '银色': '⚪'
      },
      'number': {"one":"1️⃣", "two":"2️⃣", "three":"3️⃣", "four":"4️⃣", "five":"5️⃣",
        '一': '1️⃣', '二': '2️⃣', '三': '3️⃣', '四': '4️⃣', '五': '5️⃣',
        '六': '6️⃣', '七': '7️⃣', '八': '8️⃣', '九': '9️⃣', '十': '🔟',
        '十一': '1️⃣1️⃣', '十二': '1️⃣2️⃣', '十三': '1️⃣3️⃣', '十四': '1️⃣4️⃣', '十五': '1️⃣5️⃣',
        '十六': '1️⃣6️⃣', '十七': '1️⃣7️⃣', '十八': '1️⃣8️⃣', '十九': '1️⃣9️⃣'
      },
      'transport': {"car":"🚗", "bus":"🚌", "taxi":"🚕", "train":"🚂", "plane":"✈️",
        '汽车': '🚗', '公交车': '🚌', '出租车': '🚕', '火车': '🚂', '飞机': '✈️',
        '轮船': '🚢', '自行车': '🚲', '摩托车': '🏍️', '地铁': '🚇', '高铁': '🚄',
        '卡车': '🚚', '救护车': '🚑', '消防车': '🚒', '警车': '🚓', '直升机': '🚁'
      },
      'body': {"head":"👨", "eye":"👁️", "nose":"👃", "mouth":"👄", "ear":"👂",
        '头': '👨', '眼睛': '👁️', '鼻子': '👃', '嘴巴': '👄', '耳朵': '👂',
        '脸': '😊', '头发': '👩', '脖子': '🧍', '肩膀': '💪', '手臂': '💪',
        '手': '🖐️', '手指': '🖕', '腿': '🦵', '脚': '🦶', '脚趾': '🦶',
        '心脏': '❤️', '胃': '🫀', '肝脏': '🫀', '肺': '🫁', '脑': '🧠'
      },
      'family': {"father":"👨", "mother":"👩", "brother":"👦", "sister":"👧", "grandfather":"👴",
        '爸爸': '👨', '妈妈': '👩', '哥哥': '👦', '姐姐': '👧', '弟弟': '👦',
        '妹妹': '👧', '爷爷': '👴', '奶奶': '👵', '叔叔': '👨', '阿姨': '👩',
        '堂兄弟': '👦', '堂姐妹': '👧', '表兄弟': '👦', '表姐妹': '👧', '儿子': '👶',
        '女儿': '👶', '丈夫': '👨', '妻子': '👩', '朋友': '👫'
      },
      'weather': {"sun":"☀️", "moon":"🌙", "star":"⭐", "cloud":"☁️", "rain":"🌧️",
        '太阳': '☀️', '月亮': '🌙', '星星': '⭐', '云': '☁️', '雨': '🌧️',
        '雪': '❄️', '风': '💨', '雷': '⚡', '彩虹': '🌈', '雾': '🌫️',
        '晴天': '☀️', '多云': '⛅', '阴天': '☁️', '雨天': '🌧️', '雪天': '❄️'
      },
      'action': {"run":"🏃", "walk":"🚶", "jump":"💃", "climb":"🧗", "swim":"🏊",
        '跑': '🏃', '走': '🚶', '跳': '💃', '爬': '🧗', '游泳': '🏊',
        '飞': '✈️', '吃': '🍽️', '喝': '🥤', '睡': '😴', '哭': '😭',
        '笑': '😄', '唱': '🎤', '跳': '💃', '写': '✍️', '读': '📚',
        '听': '👂', '看': '👀', '说': '💬', '想': '🤔', '做': '👷'
      },
      'emotion': {"happy":"😄", "sad":"😢", "angry":"😠", "scared":"😨", "surprised":"😲",
        '开心': '😄', '难过': '😢', '生气': '😠', '害怕': '😨', '惊讶': '😲',
        '兴奋': '🤩', '伤心': '😢', '无聊': '😴', '疲惫': '🥱', '害羞': '😊',
        '爱': '❤️', '恨': '😡', '喜欢': '😍', '讨厌': '😒', '平静': '😌'
      },
      'other': {
        '默认': '📷',
        '未知单词': '📷',
        '': '📷' // 空字符串的默认表情
      }
    };
    
    // 获取对应的emoji，增强错误处理
    let emoji = '📷';
    try {
      const emojis = categoryEmojis[category] || categoryEmojis['other'] || {};
      emoji = emojis[wordName] || emojis['默认'] || '📷';
    } catch (e) {
      emoji = '📷';
    }
    
    // 创建一个包含emoji和名称的占位div
    const placeholder = document.createElement('div');
    placeholder.className = `image-placeholder category-${category}`;
    placeholder.innerHTML = `
      <div class="emoji-display">${emoji}</div>
      <div class="word-name">${wordName}</div>
    `;
    
    // 替换图片元素
    if (img && img.parentNode) {
      img.parentNode.insertBefore(placeholder, img);
      img.style.display = 'none';
    }
  } catch (error) {
    console.error('图片错误处理过程中发生错误:', error);
    // 创建一个简单的占位div作为最后的备选方案
    try {
      const img = event.target || this;
      if (img && img.parentNode) {
        const fallbackPlaceholder = document.createElement('div');
        fallbackPlaceholder.className = 'image-placeholder category-other';
        fallbackPlaceholder.innerHTML = `
          <div class="emoji-display">📷</div>
          <div class="word-name">图片无法显示</div>
        `;
        img.parentNode.insertBefore(fallbackPlaceholder, img);
        img.style.display = 'none';
      }
    } catch (fallbackError) {
      console.error('备用错误处理也失败:', fallbackError);
    }
  }
}

function addCategoryImageStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 通用图片占位符样式 */
    .image-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background-color: #f9f9f9;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    /* 不同类别的特殊样式 */
    .image-placeholder.category-animal {
      background-color: #e8f5e9;
      border-color: #4caf50;
    }
    
    .image-placeholder.category-food {
      background-color: #fff3e0;
      border-color: #ff9800;
    }
    
    .image-placeholder.category-fruit {
      background-color: #e3f2fd;
      border-color: #2196f3;
    }
    
    .image-placeholder.category-daily {
      background-color: #f3e5f5;
      border-color: #9c27b0;
    }
    
    .image-placeholder.category-color {
      background-color: #fafafa;
      border-color: #607d8b;
    }
    
    .image-placeholder.category-number {
      background-color: #e0f7fa;
      border-color: #00bcd4;
    }
    
    .image-placeholder.category-transport {
      background-color: #f1f8e9;
      border-color: #8bc34a;
    }
    
    .image-placeholder.category-body {
      background-color: #fff8e1;
      border-color: #ffeb3b;
    }
    
    .image-placeholder.category-family {
      background-color: #fce4ec;
      border-color: #e91e63;
    }
    
    .image-placeholder.category-weather {
      background-color: #e1f5fe;
      border-color: #03a9f4;
    }
    
    .image-placeholder.category-action {
      background-color: #ede7f6;
      border-color: #673ab7;
    }
    
    .image-placeholder.category-emotion {
      background-color: #f3e5f5;
      border-color: #9575cd;
    }
    
    /* Emoji显示样式 */
    .emoji-display {
      font-size: 32px;
      margin-bottom: 4px;
    }
    
    /* 单词名称样式 */
    .word-name {
      font-size: 12px;
      color: #333;
      text-align: center;
      max-width: 90%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    /* 图片加载状态样式 */
    .word-image {
      transition: all 0.3s ease;
    }
    
    .word-image.loading {
      opacity: 0.5;
      filter: blur(2px);
    }
    
    /* 图片悬停效果 */
    .word-image:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    /* 占位符悬停效果 */
    .image-placeholder:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  `;
  document.head.appendChild(style);
}

function speakWord(word) {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  }
}

// 阅读文章时的朗读功能，包含关键词高亮
function readAloudArticle(content) {
  if (!('speechSynthesis' in window)) {
    return;
  }

  // 停止任何正在进行的语音合成
  speechSynthesis.cancel();

  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(content);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // 调整语速

  // 当前朗读的段落索引
  let currentParagraphIndex = 0;
  let paragraphs = content.split('\n');
  
  // 移除空段落
  paragraphs = paragraphs.filter(p => p.trim().length > 0);

  // 当语音开始时
  utterance.onstart = function() {
    // 高亮当前段落
    highlightCurrentParagraph(currentParagraphIndex);
  };

  // 当语音暂停时
  utterance.onpause = function() {
    unhighlightAllParagraphs();
  };

  // 当语音恢复时
  utterance.onresume = function() {
    highlightCurrentParagraph(currentParagraphIndex);
  };

  // 当语音结束时
  utterance.onend = function() {
    unhighlightAllParagraphs();
  };

  // 开始朗读
  speechSynthesis.speak(utterance);
}

// 高亮当前朗读的段落
function highlightCurrentParagraph(index) {
  const paragraphs = document.querySelectorAll('.reading-content p');
  if (index >= 0 && index < paragraphs.length) {
    paragraphs[index].classList.add('highlight');
  }
}

// 移除所有段落的高亮
function unhighlightAllParagraphs() {
  document.querySelectorAll('.reading-content p').forEach(p => {
    p.classList.remove('highlight');
  });
}

function getRandomOptions(correctAnswer, count) {
  // 获取不包含正确答案的随机单词
  const mode = document.getElementById('mode-selector').value;
  let filteredWords = window.vocabularyList;

  // 如果是听音选单词模式且选择了类别，只从该类别中获取干扰选项
  if (mode === 'listening') {
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  }

  const otherWords = filteredWords
    .filter(word => word.english.toLowerCase() !== correctAnswer.toLowerCase())
    .map(word => word.english);

  // 随机选择指定数量的单词
  const randomWords = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, count);

  // 将正确答案添加到选项中并打乱顺序
  const allOptions = [correctAnswer, ...randomWords].sort(() => 0.5 - Math.random());

  return allOptions;
}

function getRandomChineseOptions(correctAnswer, count) {
  // 获取不包含正确答案的随机中文
  const mode = document.getElementById('mode-selector').value;
  let filteredWords = window.vocabularyList;

  // 如果是看单词选中文模式且选择了类别，只从该类别中获取干扰选项
  if (mode === 'word-to-chinese') {
    const category = document.getElementById('category-selector').value;
    if (category !== 'all') {
      filteredWords = window.vocabularyList.filter(word => word.category === category);
    }
  }

  const otherWords = filteredWords
    .filter(word => word.chinese !== correctAnswer)
    .map(word => word.chinese);

  // 随机选择指定数量的中文
  const randomWords = [...otherWords].sort(() => 0.5 - Math.random()).slice(0, count);

  // 将正确答案添加到选项中并打乱顺序
  const allOptions = [correctAnswer, ...randomWords].sort(() => 0.5 - Math.random());

  return allOptions;
}

function getCategoryName(categoryCode) {
  const categories = {
    'animal': '动物',
    'food': '食物',
    'daily': '日常用品',
    'color': '颜色',
    'number': '数字',
    'fruit': '水果',
    'transport': '交通工具',
    'body': '身体部位',
    'family': '亲属',
    'weather': '天气',
    'action': '动作',
    'emotion': '情感'
  };
  return categories[categoryCode] || categoryCode;
}

function checkAnswers() {
  let correctCount = 0;
  const totalCount = currentWords.length;
  
  document.querySelectorAll('.answer-input').forEach(input => {
    const index = parseInt(input.dataset.index);
    const userAnswer = input.value.trim().toLowerCase();
    const correctAnswer = currentWords[index].english.toLowerCase();
    const wordId = currentWords[index].english.toLowerCase() + '-' + currentWords[index].category;
    
    if (userAnswer === correctAnswer) {
      input.classList.add('correct-input');
      input.classList.remove('wrong-input');
      correctCount++;
      // 如果答案正确，从错误单词列表中移除
      if (errorWords[wordId]) {
        delete errorWords[wordId];
      }
    } else {
      input.classList.add('wrong-input');
      input.classList.remove('correct-input');
      // 如果答案错误，添加或更新错误单词记录
      errorWords[wordId] = errorWords[wordId] || { word: { ...currentWords[index] }, errorCount: 0 };
      errorWords[wordId].errorCount++;
    }
  });
  
  // 保存错误单词
  saveErrorWords();
  
  // 显示结果
  const resultContainer = document.getElementById('result-container');
  resultContainer.innerHTML = `
    <div class="result-summary">
      <h3>答题结果</h3>
      <p>答对 ${correctCount} 题，答错 ${totalCount - correctCount} 题</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(correctCount / totalCount) * 100}%"></div>
      </div>
    </div>
  `;
}

function showListeningResults() {
  const resultContainer = document.getElementById('result-container');
  const correct = window.listeningAnswers.correct;
  const total = window.listeningAnswers.total;
  
  resultContainer.innerHTML = `
    <div class="result-summary">
      <h3>答题结果</h3>
      <p>答对 ${correct} 题，答错 ${total - correct} 题</p>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${(correct / total) * 100}%"></div>
      </div>
    </div>
  `;
}

function renderCards(words) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  const mode = document.getElementById('mode-selector').value;

  // 非阅读模式 - 恢复卡片容器的原始网格布局样式
  if (mode !== 'reading') {
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    container.style.gap = '25px';
  }

  // 初始化答题状态跟踪
  if (mode === 'listening' || mode === 'word-to-chinese') {
    window.listeningAnswers = { total: words.length, correct: 0, completed: 0 };
  }

  if (mode === 'reading') {
    // 阅读模式 - 调整容器样式以避免卡片重叠
    container.style.display = 'block';
    container.style.gridTemplateColumns = 'none';
    container.style.gap = '0';
      
    if (words.length === 0) {
      container.innerHTML = `
        <div class="no-words-message">
          <h3>请自选阅读类别</h3>
          <p>请从上方选择您想阅读的类别。</p>
        </div>
      `;
      return;
    }

    // 渲染阅读文章
    words.forEach(article => {
      const card = document.createElement('div');
      card.className = 'reading-card';
      
      // 将文章内容按换行符分割并处理关键词
      const paragraphs = article.content.split('\n').map(paragraph => {
        if (!paragraph.trim()) return '';
        
        // 处理关键词高亮
        let processedParagraph = paragraph;
        article.keyWords.forEach(keyword => {
          const regex = new RegExp(`\\s(${keyword})\\s`, 'g');
          processedParagraph = processedParagraph.replace(regex, ' <span class="keyword" data-keyword="$1">$1</span> ');
        });
        
        return `<p>${processedParagraph}</p>`;
      }).join('');
      
      card.innerHTML = `
        <div class="reading-header">
          <h2>${article.title}</h2>
          <h3>${article.titleChinese}</h3>
          <div class="reading-category">${getCategoryName(article.category)}</div>
        </div>
        <div class="reading-content">
          ${paragraphs}
        </div>
        <div class="reading-actions">
          <button class="read-aloud-btn">🔊 朗读全文</button>
          <button class="show-vocab-btn">📚 查看词汇</button>
        </div>
        <div class="vocab-list" style="display: none;">
          <h4>重点词汇</h4>
          <div class="vocab-items">
            ${article.keyWords.map(keyword => {
              // 查找对应的中文翻译
              const wordEntry = window.vocabularyList.find(word => 
                word.english.toLowerCase() === keyword.toLowerCase() || 
                word.english.toLowerCase() === keyword.toLowerCase().replace(/\s/g, '')
              );
              
              // 如果找到对应的词汇条目，获取图片路径
              let imageHtml = '';
              let dataTitle = '';
              if (wordEntry) {
                const imagePath = getWordImagePath(wordEntry.chinese, wordEntry.category);
                const categoryClass = `category-${wordEntry.category}`;
                imageHtml = `<img src="${imagePath}" alt="${wordEntry.chinese}" class="vocab-image word-image ${categoryClass} loading" onerror="handleImageError(this)" title="${wordEntry.chinese}" data-title="${wordEntry.chinese}" data-word="${wordEntry.chinese}" onload="this.classList.remove('loading')">`;
                dataTitle = wordEntry.chinese;
              }
              
              return `
                <div class="vocab-item">
                  <span class="vocab-keyword" title="${dataTitle}" data-title="${dataTitle}">${keyword}</span>
                  ${imageHtml}
                  <button class="vocab-speaker" data-word="${keyword}" title="${dataTitle}">🔈</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
      
      container.appendChild(card);
      
      // 添加朗读全文按钮事件
      card.querySelector('.read-aloud-btn').addEventListener('click', function() {
        readAloudArticle(article.content);
      });
      
      // 添加查看词汇按钮事件
      card.querySelector('.show-vocab-btn').addEventListener('click', function() {
        const vocabList = card.querySelector('.vocab-list');
        vocabList.style.display = vocabList.style.display === 'none' ? 'block' : 'none';
        this.textContent = vocabList.style.display === 'none' ? '📚 查看词汇' : '📚 隐藏词汇';
      });
      
      // 添加词汇发音按钮事件
      card.querySelectorAll('.vocab-speaker').forEach(btn => {
        btn.addEventListener('click', function() {
          speakWord(this.dataset.word);
        });
      });
      
      // 添加词汇项点击事件，显示中文释义
      card.querySelectorAll('.vocab-item').forEach(item => {
        item.addEventListener('click', function() {
          const keyword = this.querySelector('.vocab-keyword');
          const chineseMeaning = keyword.dataset.title || '';
          
          // 创建或获取答案显示元素
          let answerDisplay = this.querySelector('.chinese-answer');
          if (!answerDisplay) {
            answerDisplay = document.createElement('span');
            answerDisplay.className = 'chinese-answer';
            this.appendChild(answerDisplay);
          }
          
          // 切换答案显示状态
          if (answerDisplay.textContent === chineseMeaning) {
            answerDisplay.textContent = '';
          } else {
            answerDisplay.textContent = chineseMeaning;
          }
        });
      });
      
      // 添加关键词点击发音事件
      card.querySelectorAll('.keyword').forEach(span => {
        span.addEventListener('click', function() {
          speakWord(this.dataset.keyword);
        });
      });
    });
  } else if (mode === 'wordlist') {
    // 单词表模式
    if (words.length === 0) {
      container.innerHTML = `
        <div class="no-words-message">
          <h3>没有找到单词</h3>
          <p>请选择其他类别查看单词。</p>
        </div>
      `;
      return;
    }

    // 使用两列布局的卡片样式
    words.forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'word-card two-column-card';
      const imagePath = getWordImagePath(w.chinese, w.category);
      const categoryClass = `category-${w.category}`;
      
      card.innerHTML = `
        <div class="left-column">
          <div class="word-index">${i+1}</div>
          <div class="english-word">${w.english}</div>
          <button class="speaker-btn wordlist-speaker" data-word="${w.english}">🔈</button>
        </div>
        <div class="right-column">
            <div class="chinese-image">
              <img src="${imagePath}" alt="${w.chinese}" class="word-image ${categoryClass} loading" onerror="handleImageError(this)" data-word="${w.chinese}" onload="this.classList.remove('loading')">
            </div>
            <div class="phonetic">${w.phonetic}</div>
          <div class="category">${getCategoryName(w.category)}</div>
        </div>
      `;
      
      container.appendChild(card);
      card.querySelector('.wordlist-speaker').addEventListener('click', function() {
        speakWord(this.dataset.word);
      });
    });

    // 添加发音按钮事件
    document.querySelectorAll('.wordlist-speaker').forEach(btn => {
      btn.addEventListener('click', function() {
        speakWord(this.dataset.word);
      });
    });
  } else {
    // 其他模式
    words.forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'word-card';
      const wordId = w.english.toLowerCase() + '-' + w.category;
      const errorCount = errorWords[wordId] ? errorWords[wordId].errorCount : 0;
      const imagePath = getWordImagePath(w.chinese, w.category);
      const categoryClass = `category-${w.category}`;

      if (mode === 'listening') {
        // 听音选单词模式
        const options = getRandomOptions(w.english, 3);
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="chinese-image">
            <img src="${imagePath}" alt="${w.chinese}" class="word-image ${categoryClass} loading" onerror="handleImageError(this)" data-word="${w.chinese}" onload="this.classList.remove('loading')">
          </div>
          <div class="phonetic">${w.phonetic}</div>
          <div class="listening-options">
            ${options.map(option => `
              <button class="option-btn" data-answer="${option}" data-index="${i}">${option}</button>
            `).join('')}
          </div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong> (${w.chinese})</div>
          <div class="answer-status"></div>`;
      } else if (mode === 'dictation') {
        // 听写模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="dictation-prompt">听发音，写出单词</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn dictation-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong> (${w.chinese} <img src="${imagePath}" alt="${w.chinese}" class="mini-image word-image ${categoryClass} loading" onerror="handleImageError(this)" data-word="${w.chinese}" onload="this.classList.remove('loading')"> ${w.phonetic})</div>`;
      } else if (mode === 'review') {
        // 复习模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn">🔈</button></div>
          <div class="review-prompt">复习单词 (已错误 ${errorCount} 次)</div>
          <div class="chinese-image">
            <img src="${imagePath}" alt="${w.chinese}" class="word-image ${categoryClass} loading" onerror="handleImageError(this)" data-word="${w.chinese}" onload="this.classList.remove('loading')">
          </div>
          <div class="phonetic">${w.phonetic}</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong> (${w.chinese})</div>`;
      } else if (mode === 'word-to-chinese') {
        // 看单词选中文模式
        const options = getRandomChineseOptions(w.chinese, 3);
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="english-word">${w.english}</div>
          <div class="phonetic">${w.phonetic}</div>
          <div class="listening-options">
            ${options.map(option => `
              <button class="option-btn" data-answer="${option}" data-index="${i}">${option}</button>
            `).join('')}
          </div>
          <div class="correct-answer">正确答案: <strong>${w.chinese}</strong> (${w.english})</div>
          <div class="answer-status"></div>`;
      } else {
        // 普通模式和分类学习模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn">🔈</button></div>
          <div class="category-badge">${getCategoryName(w.category)}</div>
          <div class="chinese-image">
            <img src="${imagePath}" alt="${w.chinese}" class="word-image ${categoryClass} loading" onerror="handleImageError(this)" data-word="${w.chinese}" onload="this.classList.remove('loading')">
          </div>
          <div class="phonetic">${w.phonetic}</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong> (${w.chinese})</div>`;
      }

      container.appendChild(card);
      card.querySelector('.speaker-btn').addEventListener('click', () => speakWord(w.english));

      if (mode === 'listening' || mode === 'word-to-chinese') {
        card.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            // 防止重复选择
            const options = card.querySelectorAll('.option-btn');
            options.forEach(opt => opt.disabled = true);
            
            // 确定正确答案和用户选择的答案
            const userAnswer = this.dataset.answer;
            const correctAnswer = mode === 'listening' ? w.english : w.chinese;
            const isCorrect = userAnswer === correctAnswer;
            const answerStatus = card.querySelector('.answer-status');
            
            // 更新按钮样式
            this.classList.add(isCorrect ? 'correct-option' : 'wrong-option');
            
            // 显示正确答案
            if (!isCorrect) {
              // 使用更简单的方式查找正确选项
              const correctBtn = Array.from(options).find(btn => btn.dataset.answer === correctAnswer);
              if (correctBtn) {
                correctBtn.classList.add('correct-option');
              }
            }
            
            // 更新状态信息
            answerStatus.textContent = isCorrect ? '回答正确！' : '回答错误！';
            answerStatus.classList.add(isCorrect ? 'correct-status' : 'wrong-status');
            
            // 提供即时反馈动画
            answerStatus.classList.add('feedback-animation');
            setTimeout(() => {
              answerStatus.classList.remove('feedback-animation');
            }, 1000);
            
            // 更新错误单词记录和答题状态
            if (isCorrect) {
              if (errorWords[wordId]) delete errorWords[wordId];
              window.listeningAnswers.correct++;
            } else {
              errorWords[wordId] = errorWords[wordId] || { word: { ...w }, errorCount: 0 };
              errorWords[wordId].errorCount++;
            }
            saveErrorWords();
            
            window.listeningAnswers.completed++;
            
            // 检查是否所有题目都已完成
            if (window.listeningAnswers.completed === window.listeningAnswers.total) {
              showListeningResults();
            }
          });
        });
      } else {
        card.querySelector('.show-answer-btn').addEventListener('click', () => {
          card.querySelector('.correct-answer').style.display = 'block';
        });
      }
    });
  }
}