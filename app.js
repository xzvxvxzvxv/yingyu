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
  currentWords = getRandomWords(numCards);
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
    if (this.value === 'category' || this.value === 'dictation' || this.value === 'review' || this.value === 'listening' || this.value === 'wordlist' || this.value === 'word-to-chinese') {
      categorySelector.disabled = false;
    } else {
      categorySelector.disabled = true;
    }
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

function renderCards(words) {
  const container = document.getElementById('cards-container');
  container.innerHTML = '';
  const mode = document.getElementById('mode-selector').value;

  // 初始化答题状态跟踪
  if (mode === 'listening' || mode === 'word-to-chinese') {
    window.listeningAnswers = { total: words.length, correct: 0, completed: 0 };
  }

  if (mode === 'wordlist') {
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
      
      card.innerHTML = `
        <div class="left-column">
          <div class="word-index">${i+1}</div>
          <div class="english-word">${w.english}</div>
          <button class="speaker-btn wordlist-speaker" data-word="${w.english}">🔈</button>
        </div>
        <div class="right-column">
          <div class="chinese">${w.chinese}</div>
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

      if (mode === 'listening') {
        // 听音选单词模式
        const options = getRandomOptions(w.english, 3);
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="chinese">${w.chinese}</div><div class="phonetic">${w.phonetic}</div>
          <div class="listening-options">
            ${options.map(option => `
              <button class="option-btn" data-answer="${option}" data-index="${i}">${option}</button>
            `).join('')}
          </div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong></div>
          <div class="answer-status"></div>`;
      } else if (mode === 'dictation') {
        // 听写模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="dictation-prompt">听发音，写出单词</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn dictation-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong> (${w.chinese} ${w.phonetic})</div>`;
      } else if (mode === 'review') {
        // 复习模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn">🔈</button></div>
          <div class="review-prompt">复习单词 (已错误 ${errorCount} 次)</div>
          <div class="chinese">${w.chinese}</div><div class="phonetic">${w.phonetic}</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong></div>`;
      } else if (mode === 'word-to-chinese') {
        // 看单词选中文模式
        const options = getRandomChineseOptions(w.chinese, 3);
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn dictation-btn">🔈</button></div>
          <div class="english-word">${w.english}</div><div class="phonetic">${w.phonetic}</div>
          <div class="listening-options">
            ${options.map(option => `
              <button class="option-btn" data-answer="${option}" data-index="${i}">${option}</button>
            `).join('')}
          </div>
          <div class="correct-answer">正确答案: <strong>${w.chinese}</strong></div>
          <div class="answer-status"></div>`;
      } else {
        // 普通模式和分类学习模式
        card.innerHTML = `
          <div class="card-header"><div class="word-index">${i+1}</div><button class="speaker-btn">🔈</button></div>
          <div class="category-badge">${getCategoryName(w.category)}</div>
          <div class="chinese">${w.chinese}</div><div class="phonetic">${w.phonetic}</div>
          <div class="input-container"><input type="text" class="answer-input" data-index="${i}" placeholder="输入英文单词">
          <button class="show-answer-btn">显示答案</button></div>
          <div class="correct-answer">正确答案: <strong>${w.english}</strong></div>`;
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

function speakWord(word) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    speechSynthesis.speak(u);
  }
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

  return categories[categoryCode] || '';
}

function showListeningResults() {
  const resultContainer = document.getElementById('result-container');
  const { total, correct } = window.listeningAnswers;
  const percent = Math.round(correct / total * 100);
  const mode = document.getElementById('mode-selector').value;
  const title = mode === 'listening' ? '听音选单词结果' : '看单词选中文结果';

  resultContainer.innerHTML = `
    <h2>${title}</h2>
    <p>答对: ${correct} / ${total}</p>
    <p>正确率: ${percent}%</p>
  `;
  resultContainer.style.display = 'block';

  // 如果所有单词都正确，显示成功消息
  if (correct === total) {
    resultContainer.innerHTML += `<p class="success-message">恭喜！你答对了所有题目！</p>`;
  }
}

function checkAnswers() {
  let correct = 0;
  const inputs = document.querySelectorAll('.answer-input');
  const mode = document.getElementById('mode-selector').value;

  inputs.forEach(input => {
    const idx = input.dataset.index;
    const word = currentWords[idx];
    const wordId = word.english.toLowerCase() + '-' + word.category;

    if (input.value.trim().toLowerCase() === word.english.toLowerCase()) {
      input.classList.add('correct-input');
      correct++;

      // 如果单词在错误列表中，移除它
      if (errorWords[wordId]) {
        delete errorWords[wordId];
        saveErrorWords();
      }
    } else {
      input.classList.add('wrong-input');
      input.closest('.word-card').querySelector('.correct-answer').style.display = 'block';

      // 更新错误次数
      if (errorWords[wordId]) {
        errorWords[wordId].errorCount++;
      } else {
        errorWords[wordId] = { word: { ...word }, errorCount: 1 };
      }
      saveErrorWords();
    }
  });

  const percent = Math.round(correct / inputs.length * 100);
  const resultContainer = document.getElementById('result-container');
  resultContainer.innerHTML = `<h2>正确率 ${percent}% (${correct}/${inputs.length})</h2>`;
  resultContainer.style.display = 'block';

  // 如果是复习模式且所有单词都正确，显示成功消息
  if (mode === 'review' && correct === inputs.length && inputs.length > 0) {
    resultContainer.innerHTML += `<p class="success-message">恭喜！你已经掌握了所有复习单词！</p>`;
  }
}

// 单词搜索功能
function setupWordSearch() {
  const searchInput = document.getElementById('word-search-input');
  const levelSelector = document.getElementById('word-level-selector');
  const searchBtn = document.getElementById('search-btn');
  const searchResults = document.getElementById('search-results');
  
  // 缓存机制 - 存储已加载的单词数据
  const wordDataCache = {};
  // 上次搜索的参数
  let lastSearchParams = { term: '', level: '' };
  
  // 搜索按钮点击事件
  searchBtn.addEventListener('click', () => {
    performSearch(true); // 强制搜索
  });
  
  // 回车键搜索
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(true); // 强制搜索
    }
  });
  
  // 实时搜索功能 - 优化防抖
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    // 增加防抖时间到600毫秒，减少搜索频率
    searchTimeout = setTimeout(() => {
      performSearch();
    }, 600);
  });
  
  // 级别选择变化时也进行搜索
  levelSelector.addEventListener('change', () => {
    // 级别变化时清除缓存相关项
    if (levelSelector.value === 'all') {
      // 选择全部级别时清除所有缓存
      Object.keys(wordDataCache).forEach(key => {
        if (key !== 'all') delete wordDataCache[key];
      });
    } else {
      // 清除全部级别的缓存
      delete wordDataCache['all'];
    }
    performSearch(true); // 强制搜索
  });
  
  async function performSearch(force = false) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedLevel = levelSelector.value;
    
    // 快速处理空输入
    if (!searchTerm) {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      return;
    }
    
    // 检查是否需要重新搜索（搜索词变化或强制搜索）
    const shouldSearch = force || 
                       lastSearchParams.term !== searchTerm || 
                       lastSearchParams.level !== selectedLevel;
    
    if (!shouldSearch) {
      return; // 无需重新搜索
    }
    
    // 更新上次搜索参数
    lastSearchParams = { term: searchTerm, level: selectedLevel };
    
    // 显示加载状态
    searchResults.style.display = 'block';
    searchResults.innerHTML = '<div class="search-loading">搜索中...</div>';
    
    try {
      // 检查缓存
      let allWordData = [];
      let needLoad = false;
      
      if (selectedLevel === 'all') {
        // 检查全部级别的缓存
        if (!wordDataCache['all']) {
          needLoad = true;
        } else {
          allWordData = wordDataCache['all'];
        }
      } else {
        // 检查单个级别的缓存
        if (!wordDataCache[selectedLevel]) {
          needLoad = true;
        } else {
          allWordData = wordDataCache[selectedLevel];
        }
      }
      
      // 如果需要加载数据
      if (needLoad) {
        if (selectedLevel === 'all') {
          // 加载所有级别的文件
          const levelFiles = [
            '1-初中-顺序.json',
            '2-高中-顺序.json', 
            '3-CET4-顺序.json',
            '4-CET6-顺序.json',
            '5-考研-顺序.json',
            '6-托福-顺序.json',
            '7-SAT-顺序.json'
          ];
          
          // 检查单个文件缓存，避免重复加载
          const loadPromises = levelFiles.map(file => {
            if (wordDataCache[file]) {
              return Promise.resolve({ file, data: wordDataCache[file].rawData });
            }
            return fetch(`json/${file}`).then(response => {
              if (!response.ok) throw new Error(`无法加载文件: ${file}`);
              return response.json().then(data => ({ file, data }));
            });
          });
          
          const results = await Promise.all(loadPromises);
          
          results.forEach(({ file, data }) => {
            if (Array.isArray(data)) {
              // 保存原始数据到缓存
              if (!wordDataCache[file]) {
                wordDataCache[file] = { rawData: data };
              }
              
              const processedData = data.map(word => ({
                ...word,
                level: getLevelName(file)
              }));
              
              allWordData = allWordData.concat(processedData);
            } else {
              console.warn(`文件 ${file} 的数据格式不正确`);
            }
          });
          
          // 缓存全部级别的合并数据
          wordDataCache['all'] = allWordData;
        } else {
          // 加载单个级别的文件
          const response = await fetch(`json/${selectedLevel}`);
          if (!response.ok) throw new Error(`无法加载文件: ${selectedLevel}`);
          
          const data = await response.json();
          if (Array.isArray(data)) {
            // 保存原始数据到缓存
            wordDataCache[selectedLevel] = { rawData: data };
            
            allWordData = data.map(word => ({
              ...word,
              level: getLevelName(selectedLevel)
            }));
          } else {
            throw new Error(`文件 ${selectedLevel} 的数据格式不正确`);
          }
        }
      }
      
      // 搜索单词 - 提前过滤减少后续处理量
      const filteredWords = allWordData.filter(word => 
        word.word && word.word.toLowerCase().includes(searchTerm)
      );
      
      // 优化DOM操作 - 使用DocumentFragment批量添加
      const fragment = document.createDocumentFragment();
      
      // 显示搜索结果
      if (filteredWords.length > 0) {
        // 限制最多显示100条结果，避免DOM元素过多
        const displayResults = filteredWords.slice(0, 100);
        
        displayResults.forEach(word => {
          const resultItem = document.createElement('div');
          resultItem.className = 'search-result-item';
          
          // 构建翻译部分
          let translationsHtml = '';
          if (word.translations && Array.isArray(word.translations)) {
            translationsHtml = word.translations.map(t => 
              t.type ? `${t.translation} (${t.type})` : t.translation
            ).join('；');
          }
          
          // 构建短语部分 - 简化处理减少嵌套
          let phrasesHtml = '';
          if (word.phrases && Array.isArray(word.phrases)) {
            const phrases = word.phrases.map(p => 
              `<div class="phrase"><strong>${p.phrase}</strong>: ${p.translation}</div>`
            ).join('');
            phrasesHtml = `<div class="phrases">${phrases}</div>`;
          }
          
          // 设置结果项内容
          resultItem.innerHTML = `
            <h4>${word.word} <small>(${word.level})</small></h4>
            <div class="translations">${translationsHtml}</div>
            ${phrasesHtml}
          `;
          
          fragment.appendChild(resultItem);
        });
        
        // 如果结果超过100条，显示提示
        if (filteredWords.length > 100) {
          const moreResults = document.createElement('div');
          moreResults.className = 'more-results';
          moreResults.textContent = `找到 ${filteredWords.length} 个结果，显示前100个`;
          fragment.appendChild(moreResults);
        }
      } else {
        const noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.textContent = `未找到包含 "${searchTerm}" 的单词`;
        fragment.appendChild(noResults);
      }
      
      // 一次性更新DOM
      searchResults.innerHTML = '';
      searchResults.appendChild(fragment);
      
    } catch (error) {
      console.error('搜索出错:', error);
      searchResults.innerHTML = `<div class="no-results">搜索出错: ${error.message}</div>`;
    }
  }
  
  // 获取级别名称
  function getLevelName(fileName) {
    const levelMap = {
      '1-初中-顺序.json': '初中',
      '2-高中-顺序.json': '高中',
      '3-CET4-顺序.json': 'CET4',
      '4-CET6-顺序.json': 'CET6',
      '5-考研-顺序.json': '考研',
      '6-托福-顺序.json': '托福',
      '7-SAT-顺序.json': 'SAT'
    };
    return levelMap[fileName] || fileName;
  }
}

// 在DOMContentLoaded中初始化单词搜索功能
document.addEventListener('DOMContentLoaded', () => {
  // 检查是否已添加搜索相关元素
  if (document.getElementById('word-search-input')) {
    setupWordSearch();
  }
});