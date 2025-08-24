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
    if (this.value === 'category' || this.value === 'dictation' || this.value === 'review' || this.value === 'listening' || this.value === 'wordlist') {
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
  }

  // 如果筛选后的单词数量不足，使用所有单词（复习模式和单词表模式除外）
  if (filteredWords.length < count && mode !== 'review' && mode !== 'wordlist') {
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
  if (mode === 'listening') {
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

      if (mode === 'listening') {
        card.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            // 防止重复选择
            const options = card.querySelectorAll('.option-btn');
            options.forEach(opt => opt.disabled = true);
            


            const isCorrect = this.dataset.answer === w.english;
            const answerStatus = card.querySelector('.answer-status');
            


            if (isCorrect) {
              this.classList.add('correct-option');
              answerStatus.textContent = '回答正确！';
              answerStatus.classList.add('correct-status');
              


              // 更新答题状态
              window.listeningAnswers.correct++;
              // 如果单词在错误列表中，移除它
              if (errorWords[wordId]) {
                delete errorWords[wordId];
              }
              saveErrorWords();
            } else {
              this.classList.add('wrong-option');
              // 找出正确选项并高亮
              const correctBtn = card.querySelector(`.option-btn[data-answer="${w.english}"]`);
              correctBtn.classList.add('correct-option');
              answerStatus.textContent = '回答错误！';
              answerStatus.classList.add('wrong-status');
              


              // 更新错误次数
              if (errorWords[wordId]) {
                errorWords[wordId].errorCount++;
              } else {
                errorWords[wordId] = { word: { ...w }, errorCount: 1 };
              }
              saveErrorWords();
            }
            


            // 更新完成数量
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
    'family': '亲属'
  };

  return categories[categoryCode] || '';
}

function showListeningResults() {
  const resultContainer = document.getElementById('result-container');
  const { total, correct } = window.listeningAnswers;
  const percent = Math.round(correct / total * 100);

  resultContainer.innerHTML = `
    <h2>听音选单词结果</h2>
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