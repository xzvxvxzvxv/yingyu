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
    if (this.value === 'category' || this.value === 'dictation' || this.value === 'review' || this.value === 'listening' || this.value === 'wordlist' || this.value === 'word-to-chinese' || this.value === 'reading') {
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
  } else if (mode === 'reading') {
    // 阅读模式下，我们返回文章数据
    return getReadingArticles(document.getElementById('category-selector').value);
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
              return `
                <div class="vocab-item">
                  <span class="vocab-keyword">${keyword}</span>
                  <span class="vocab-chinese">${wordEntry ? wordEntry.chinese : ''}</span>
                  <button class="vocab-speaker" data-word="${keyword}">🔈</button>
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

// 朗读整个文章
function readAloudArticle(content) {
  if ('speechSynthesis' in window) {
    // 先停止可能正在进行的朗读
    speechSynthesis.cancel();
    
    // 移除关键词标记并朗读
    const cleanContent = content.replace(/<[^>]*>/g, '');
    const u = new SpeechSynthesisUtterance(cleanContent);
    u.lang = 'en-US';
    u.rate = 0.8; // 稍微降低语速
    speechSynthesis.speak(u);
  }
}

// 获取指定类别的文章
function getReadingArticles(category = "all") {
  if (!window.readingArticles) return [];
  
  if (category === "all") {
    return window.readingArticles;
  }
  return window.readingArticles.filter(article => article.category === category);
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