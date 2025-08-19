// 全局变量
let currentLotteryType = 'doubleColor';
let currentDrawType = 'doubleColor';
let selectedNumbers = {
    doubleColor: { red: [], blue: [] },
    daletou: { front: [], back: [] }
};
let userTickets = [];
let drawResults = {
    doubleColor: [],
    daletou: []
};
let accountBalance = 1000;
let stats = {
    totalTickets: 0,
    totalWins: 0,
    totalSpent: 0,
    totalWinnings: 0
};
let betQuantity = 1;
const ticketPrice = 2;
let currentDrawResult = {};
let redemptionHistory = [];
let pendingTicketsFilter = { type: 'all', level: 'all' };
let pendingTicketsSort = 'amount';

// 奖金配置
const prizeConfig = {
    doubleColor: {
        '6-1': { level: 1, amount: 5000000, name: '一等奖' },
        '6-0': { level: 2, amount: 100000, name: '二等奖' },
        '5-1': { level: 3, amount: 3000, name: '三等奖' },
        '5-0': { level: 4, amount: 200, name: '四等奖' },
        '4-1': { level: 4, amount: 200, name: '四等奖' },
        '4-0': { level: 5, amount: 10, name: '五等奖' },
        '3-1': { level: 5, amount: 10, name: '五等奖' },
        '2-1': { level: 6, amount: 5, name: '六等奖' },
        '1-1': { level: 6, amount: 5, name: '六等奖' },
        '0-1': { level: 6, amount: 5, name: '六等奖' }
    },
    daletou: {
        '5-2': { level: 1, amount: 10000000, name: '一等奖' },
        '5-1': { level: 2, amount: 200000, name: '二等奖' },
        '5-0': { level: 3, amount: 10000, name: '三等奖' },
        '4-2': { level: 4, amount: 3000, name: '四等奖' },
        '4-1': { level: 5, amount: 300, name: '五等奖' },
        '3-2': { level: 6, amount: 200, name: '六等奖' },
        '4-0': { level: 7, amount: 100, name: '七等奖' },
        '3-1': { level: 8, amount: 15, name: '八等奖' },
        '2-2': { level: 8, amount: 15, name: '八等奖' },
        '3-0': { level: 9, amount: 5, name: '九等奖' },
        '2-1': { level: 9, amount: 5, name: '九等奖' },
        '1-2': { level: 9, amount: 5, name: '九等奖' }
    }
};

// UI/UX 增强组件
let statusIndicator;
let progressIndicator;

// 初始化球体
function initializeBalls() {
    createBallGrid('redBallGrid', 33, 'red-ball', selectBall);
    createBallGrid('blueBallGrid', 16, 'blue-ball', selectBall);
    createBallGrid('frontBallGrid', 35, 'front-ball', selectBall);
    createBallGrid('backBallGrid', 12, 'back-ball', selectBall);
}

// 创建球体网格
// 🚀 性能优化：使用DocumentFragment批量创建球体
function createBallGrid(containerId, count, ballClass, clickHandler) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    // 使用DocumentFragment减少DOM重排
    const fragment = document.createDocumentFragment();
    
    for (let i = 1; i <= count; i++) {
        const ball = document.createElement('div');
        ball.className = `ball ${ballClass}`;
        ball.textContent = i.toString().padStart(2, '0');
        ball.dataset.number = i;
        ball.onclick = () => clickHandler(ball, i);
        fragment.appendChild(ball);
    }
    
    // 一次性添加所有球体，减少重排次数
    container.appendChild(fragment);
}

// 选择球体
function selectBall(ballElement, number) {
    const ballType = getBallType(ballElement);
    const isSelected = ballElement.classList.contains('selected');
    
    if (isSelected) {
        // 取消选择
        ballElement.classList.remove('selected');
        removeFromSelection(ballType, number);
        playBallDeselectSound();
    } else {
        // 检查是否可以选择
        if (canSelectBall(ballType)) {
            ballElement.classList.add('selected');
            addToSelection(ballType, number);
            playBallSelectSound();
        } else {
            // 显示限制提示
            showSelectionLimitAlert(ballType);
            AnimationManager.shake(ballElement);
        }
    }
    
    updateSelectedDisplay();
}

// 获取球体类型
function getBallType(ballElement) {
    if (ballElement.classList.contains('red-ball')) return 'red';
    if (ballElement.classList.contains('blue-ball')) return 'blue';
    if (ballElement.classList.contains('front-ball')) return 'front';
    if (ballElement.classList.contains('back-ball')) return 'back';
    return null;
}

// 检查是否可以选择球体
function canSelectBall(ballType) {
    const current = selectedNumbers[currentLotteryType];
    
    if (currentLotteryType === 'doubleColor') {
        if (ballType === 'red') return current.red.length < 6;
        if (ballType === 'blue') return current.blue.length < 1;
    } else {
        if (ballType === 'front') return current.front.length < 5;
        if (ballType === 'back') return current.back.length < 2;
    }
    
    return false;
}

// 添加到选择
function addToSelection(ballType, number) {
    const current = selectedNumbers[currentLotteryType];
    
    if (currentLotteryType === 'doubleColor') {
        if (ballType === 'red' && !current.red.includes(number)) {
            current.red.push(number);
            current.red.sort((a, b) => a - b);
        }
        if (ballType === 'blue' && !current.blue.includes(number)) {
            current.blue = [number];
        }
    } else {
        if (ballType === 'front' && !current.front.includes(number)) {
            current.front.push(number);
            current.front.sort((a, b) => a - b);
        }
        if (ballType === 'back' && !current.back.includes(number)) {
            current.back.push(number);
            current.back.sort((a, b) => a - b);
        }
    }
}

// 从选择中移除
function removeFromSelection(ballType, number) {
    const current = selectedNumbers[currentLotteryType];
    
    if (currentLotteryType === 'doubleColor') {
        if (ballType === 'red') {
            current.red = current.red.filter(n => n !== number);
        }
        if (ballType === 'blue') {
            current.blue = current.blue.filter(n => n !== number);
        }
    } else {
        if (ballType === 'front') {
            current.front = current.front.filter(n => n !== number);
        }
        if (ballType === 'back') {
            current.back = current.back.filter(n => n !== number);
        }
    }
}

// 更新已选号码显示
function updateSelectedDisplay() {
    const current = selectedNumbers[currentLotteryType];
    
    if (currentLotteryType === 'doubleColor') {
        updateBallContainer('selectedRedBalls', current.red, 'red-ball');
        updateBallContainer('selectedBlueBalls', current.blue, 'blue-ball');
    } else {
        updateBallContainer('selectedFrontBalls', current.front, 'front-ball');
        updateBallContainer('selectedBackBalls', current.back, 'back-ball');
    }
}

// 更新球体容器
function updateBallContainer(containerId, numbers, ballClass) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    numbers.forEach(number => {
        const ball = document.createElement('div');
        ball.className = `selected-ball ${ballClass}`;
        ball.textContent = number.toString().padStart(2, '0');
        container.appendChild(ball);
    });
}

// 切换彩票类型
function switchLotteryType(type) {
    currentLotteryType = type;
    
    // 安全地更新按钮状态
    try {
        document.querySelectorAll('#selection .lottery-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 查找对应类型的按钮并激活
        const targetBtn = document.querySelector(`[onclick*="switchLotteryType('${type}')"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    } catch (btnError) {
        console.log('彩票类型按钮更新失败:', btnError);
    }
    
    // 显示/隐藏选号区域
    const doubleColorSelection = document.getElementById('doubleColorSelection');
    const daletouSelection = document.getElementById('daletouSelection');
    
    if (doubleColorSelection) {
        doubleColorSelection.style.display = type === 'doubleColor' ? 'block' : 'none';
    }
    if (daletouSelection) {
        daletouSelection.style.display = type === 'daletou' ? 'block' : 'none';
    }
    
    // 清除当前选择
    clearSelection();
    
    if (statusIndicator) {
        statusIndicator.show(`切换到${type === 'doubleColor' ? '双色球' : '大乐透'}`, 'info', 1500);
    }
}

// 清除选择
function clearSelection() {
    // 清除选择状态
    selectedNumbers[currentLotteryType] = currentLotteryType === 'doubleColor' 
        ? { red: [], blue: [] } 
        : { front: [], back: [] };
    
    // 清除球体选中状态
    document.querySelectorAll('.ball.selected').forEach(ball => {
        ball.classList.remove('selected');
    });
    
    // 清除高亮状态
    document.querySelectorAll('.ball.highlight, .ball.super-highlight').forEach(ball => {
        ball.classList.remove('highlight', 'super-highlight');
    });
    
    // 更新显示
    updateSelectedDisplay();
    
    statusIndicator.show('已清除选号', 'info', 1000);
}

// 机选号码 - 增强版
function randomSelect(quantity = 1) {
    if (quantity === 1) {
        // 原有的单注随机逻辑
        const randomBtn = document.querySelector('.btn-random');
        if (randomBtn) {
            randomBtn.disabled = true;
            randomBtn.textContent = '🎰 机选中...';
        }
        
        playRandomSelectSound();
        
        if (currentLotteryType === 'doubleColor') {
            animatedRandomSelectDoubleColorEnhanced();
        } else {
            animatedRandomSelectDaletouEnhanced();
        }
    } else {
        // 调用批量随机
        const quantitySelect = document.getElementById('randomQuantity');
        if (quantitySelect) {
            quantitySelect.value = quantity;
        }
        batchRandomSelect();
    }
}

// 增强双色球跑马灯机选
function animatedRandomSelectDoubleColorEnhanced() {
    clearSelection();
    
    // 添加机选特效样式
    addRandomSelectStyles();
    
    // 红球跑马灯效果
    let redBallIndex = 0;
    const redBalls = document.querySelectorAll('.red-ball');
    
    // 添加全局闪烁效果
    const redGrid = document.querySelector('.red-ball-grid');
    if (redGrid) redGrid.classList.add('random-selecting');
    
    const redInterval = setInterval(() => {
        // 清除之前的高亮
        redBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮多个球，创建更强烈的视觉效果
        for (let i = 0; i < 12; i++) {
            const randomBall = redBalls[Math.floor(Math.random() * redBalls.length)];
            if (i < 3) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        // 播放跑马灯音效
        if (redBallIndex % 3 === 0) {
            playRandomTickSound();
        }
        
        redBallIndex++;
        
        if (redBallIndex > 30) {
            clearInterval(redInterval);
            if (redGrid) redGrid.classList.remove('random-selecting');
            
            // 确定最终红球
            const finalRedNumbers = generateRandomNumbers(33, 6);
            finalRedNumbers.forEach((num, index) => {
                setTimeout(() => {
                    // 清除所有高亮
                    redBalls.forEach(ball => {
                        ball.classList.remove('highlight', 'super-highlight');
                    });
                    
                    const ball = document.querySelector(`[data-number="${num}"].red-ball`);
                    if (ball) {
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.doubleColor.red.push(num);
                        playBallConfirmSound();
                        
                        // 添加确定动画
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalRedNumbers.length - 1) {
                            selectedNumbers.doubleColor.red.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            
                            // 开始蓝球选择
                            setTimeout(() => {
                                animatedSelectBlueBallEnhanced();
                            }, 500);
                        }
                    }
                }, index * 400);
            });
        }
    }, 80); // 更快的切换速度
}

// 增强蓝球动画选择
function animatedSelectBlueBallEnhanced() {
    let blueBallIndex = 0;
    const blueBalls = document.querySelectorAll('.blue-ball');
    
    // 添加蓝球区域特效
    const blueGrid = document.querySelector('.blue-ball-grid');
    if (blueGrid) blueGrid.classList.add('random-selecting');
    
    const blueInterval = setInterval(() => {
        // 清除之前的高亮
        blueBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮球，创建追逐效果
        for (let i = 0; i < 6; i++) {
            const randomBall = blueBalls[Math.floor(Math.random() * blueBalls.length)];
            if (i < 2) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        // 播放跑马灯音效
        if (blueBallIndex % 2 === 0) {
            playRandomTickSound();
        }
        
        blueBallIndex++;
        
        if (blueBallIndex > 20) {
            clearInterval(blueInterval);
            if (blueGrid) blueGrid.classList.remove('random-selecting');
            
            // 确定最终蓝球
            const finalBlueNumber = Math.floor(Math.random() * 16) + 1;
            const ball = document.querySelector(`[data-number="${finalBlueNumber}"].blue-ball`);
            if (ball) {
                // 清除所有高亮
                blueBalls.forEach(b => {
                    b.classList.remove('highlight', 'super-highlight');
                });
                
                ball.classList.add('selected', 'final-selected');
                selectedNumbers.doubleColor.blue = [finalBlueNumber];
                updateSelectedDisplay();
                playBallConfirmSound();
                
                // 添加确定动画
                ball.style.animation = 'ballConfirm 0.6s ease-out';
                
                // 完成机选
                finishRandomSelect();
            }
        }
    }, 120); // 稍慢的蓝球速度
}

// 增强大乐透跑马灯机选
function animatedRandomSelectDaletouEnhanced() {
    clearSelection();
    addRandomSelectStyles();
    
    // 前区跑马灯效果
    let frontBallIndex = 0;
    const frontBalls = document.querySelectorAll('.front-ball');
    const frontGrid = document.querySelector('.front-ball-grid');
    if (frontGrid) frontGrid.classList.add('random-selecting');
    
    const frontInterval = setInterval(() => {
        frontBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        for (let i = 0; i < 15; i++) {
            const randomBall = frontBalls[Math.floor(Math.random() * frontBalls.length)];
            if (i < 4) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        if (frontBallIndex % 3 === 0) {
            playRandomTickSound();
        }
        
        frontBallIndex++;
        
        if (frontBallIndex > 35) {
            clearInterval(frontInterval);
            if (frontGrid) frontGrid.classList.remove('random-selecting');
            
            const finalFrontNumbers = generateRandomNumbers(35, 5);
            finalFrontNumbers.forEach((num, index) => {
                setTimeout(() => {
                    frontBalls.forEach(ball => {
                        ball.classList.remove('highlight', 'super-highlight');
                    });
                    
                    const ball = document.querySelector(`[data-number="${num}"].front-ball`);
                    if (ball) {
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.daletou.front.push(num);
                        playBallConfirmSound();
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalFrontNumbers.length - 1) {
                            selectedNumbers.daletou.front.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            
                            setTimeout(() => {
                                animatedSelectBackBallsEnhanced();
                            }, 500);
                        }
                    }
                }, index * 400);
            });
        }
    }, 70);
}

// 增强后区动画选择
function animatedSelectBackBallsEnhanced() {
    let backBallIndex = 0;
    const backBalls = document.querySelectorAll('.back-ball');
    const backGrid = document.querySelector('.back-ball-grid');
    if (backGrid) backGrid.classList.add('random-selecting');
    
    const backInterval = setInterval(() => {
        backBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        for (let i = 0; i < 8; i++) {
            const randomBall = backBalls[Math.floor(Math.random() * backBalls.length)];
            if (i < 3) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        if (backBallIndex % 2 === 0) {
            playRandomTickSound();
        }
        
        backBallIndex++;
        
        if (backBallIndex > 25) {
            clearInterval(backInterval);
            if (backGrid) backGrid.classList.remove('random-selecting');
            
            const finalBackNumbers = generateRandomNumbers(12, 2);
            finalBackNumbers.forEach((num, index) => {
                setTimeout(() => {
                    backBalls.forEach(ball => {
                        ball.classList.remove('highlight', 'super-highlight');
                    });
                    
                    const ball = document.querySelector(`[data-number="${num}"].back-ball`);
                    if (ball) {
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.daletou.back.push(num);
                        playBallConfirmSound();
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalBackNumbers.length - 1) {
                            selectedNumbers.daletou.back.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            finishRandomSelect();
                        }
                    }
                }, index * 500);
            });
        }
    }, 100);
}

// 完成机选
function finishRandomSelect() {
    // 恢复按钮状态
    const randomBtn = document.querySelector('.btn-random');
    if (randomBtn) {
        randomBtn.disabled = false;
        randomBtn.textContent = '🎲 机选';
    }
    
    // 清除所有高亮和特效
    document.querySelectorAll('.ball').forEach(ball => {
        ball.classList.remove('highlight', 'super-highlight', 'final-selected');
        ball.style.animation = '';
    });
    
    document.querySelectorAll('.ball-grid').forEach(grid => {
        grid.classList.remove('random-selecting');
    });
    
    // 播放完成音效
    playRandomCompleteSound();
    
    // 显示完成提示
    statusIndicator.show('🎉 机选完成！', 'success', 2000);
}

// 🔥 新增：批量随机选择函数
function batchRandomSelect() {
    const quantitySelect = document.getElementById('randomQuantity');
    const quantity = parseInt(quantitySelect?.value) || 1;
    

    
    // 清除当前选择
    clearSelection();
    
    // 生成多注不同的随机号码
    const generatedTickets = [];
    
    for (let i = 0; i < quantity; i++) {
        let attempts = 0;
        let newTicket;
        
        // 确保生成不重复的号码组合
        do {
            newTicket = generateSingleRandomTicket();
            attempts++;
        } while (isDuplicateTicket(newTicket, generatedTickets) && attempts < 100);
        
        if (attempts < 100) {
            generatedTickets.push(newTicket);
        } else {

        }
    }
    
    // 设置投注数量
    setQuantity(generatedTickets.length);
    
    // 显示生成结果
    showBatchRandomResult(generatedTickets);
    

}

// 🔥 新增：生成单注随机票据
function generateSingleRandomTicket() {
    if (currentLotteryType === 'doubleColor') {
        return generateDoubleColorTicket();
    } else {
        return generateDaletouTicket();
    }
}

// 🔥 新增：生成双色球随机票据
function generateDoubleColorTicket() {
    // 生成6个红球（1-33）
    const redNumbers = [];
    while (redNumbers.length < 6) {
        const num = Math.floor(Math.random() * 33) + 1;
        if (!redNumbers.includes(num)) {
            redNumbers.push(num);
        }
    }
    redNumbers.sort((a, b) => a - b);
    
    // 生成1个蓝球（1-16）
    const blueNumber = Math.floor(Math.random() * 16) + 1;
    
    return {
        type: 'doubleColor',
        red: redNumbers,
        blue: [blueNumber],
        numbers: redNumbers,
        blueNumber: blueNumber
    };
}

// 🔥 新增：生成大乐透随机票据
function generateDaletouTicket() {
    // 生成5个前区号码（1-35）
    const frontNumbers = [];
    while (frontNumbers.length < 5) {
        const num = Math.floor(Math.random() * 35) + 1;
        if (!frontNumbers.includes(num)) {
            frontNumbers.push(num);
        }
    }
    frontNumbers.sort((a, b) => a - b);
    
    // 生成2个后区号码（1-12）
    const backNumbers = [];
    while (backNumbers.length < 2) {
        const num = Math.floor(Math.random() * 12) + 1;
        if (!backNumbers.includes(num)) {
            backNumbers.push(num);
        }
    }
    backNumbers.sort((a, b) => a - b);
    
    return {
        type: 'daletou',
        front: frontNumbers,
        back: backNumbers,
        frontNumbers: frontNumbers,
        backNumbers: backNumbers
    };
}

// 🔥 新增：检查是否为重复票据
function isDuplicateTicket(newTicket, existingTickets) {
    return existingTickets.some(ticket => {
        if (ticket.type !== newTicket.type) return false;
        
        if (newTicket.type === 'doubleColor') {
            return arraysEqual(ticket.red, newTicket.red) && 
                   arraysEqual(ticket.blue, newTicket.blue);
        } else {
            return arraysEqual(ticket.front, newTicket.front) && 
                   arraysEqual(ticket.back, newTicket.back);
        }
    });
}

// 🔥 新增：数组比较函数
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
}

// 🔥 新增：显示批量随机结果
function showBatchRandomResult(tickets) {
    if (tickets.length === 0) {
        showCenterModal('⚠️ 批量机选', '生成失败，请重试', 'warning');
        return;
    }
    
    // 🔥 将tickets数据存储到全局变量，避免HTML传递问题
    window.currentBatchTickets = tickets;
    
    let resultHtml = `
        <div class="batch-random-result">
            <h3>🎲 批量机选结果</h3>
            <p class="result-summary">共生成 <strong>${tickets.length}</strong> 注不同号码</p>
            <div class="tickets-preview">
    `;
    
    tickets.slice(0, 10).forEach((ticket, index) => {
        if (ticket.type === 'doubleColor') {
            resultHtml += `
                <div class="ticket-preview">
                    <span class="ticket-number">${index + 1}.</span>
                    <span class="red-numbers">${ticket.red.join(' ')}</span>
                    <span class="blue-numbers">${ticket.blue.join(' ')}</span>
                </div>
            `;
        } else {
            resultHtml += `
                <div class="ticket-preview">
                    <span class="ticket-number">${index + 1}.</span>
                    <span class="front-numbers">${ticket.front.join(' ')}</span>
                    <span class="back-numbers">${ticket.back.join(' ')}</span>
                </div>
            `;
        }
    });
    
    if (tickets.length > 10) {
        resultHtml += `<div class="more-tickets">... 还有 ${tickets.length - 10} 注</div>`;
    }
    
    resultHtml += `
            </div>
            <div class="result-actions">
                <button class="btn btn-primary" onclick="confirmCurrentBatchTickets(); closeCenterModal()">✅ 确认投注</button>
                <button class="btn btn-secondary" onclick="closeCenterModal()">❌ 重新选择</button>
            </div>
        </div>
    `;
    
    showCenterModal('🎲 批量机选结果', resultHtml, 'info');
}

// 🔥 新增：确认当前批量票据的包装函数
function confirmCurrentBatchTickets() {
    if (window.currentBatchTickets && Array.isArray(window.currentBatchTickets)) {
        const success = confirmBatchTickets(window.currentBatchTickets);
        if (success) {
            // 清除临时数据
            window.currentBatchTickets = null;
        }
        return success;
    } else {
        showCenterModal('❌ 错误', '票据数据丢失，请重新生成', 'error');
        return false;
    }
}

// 🔥 新增：处理批量投注确认（避免JSON传递问题）
function processBatchConfirmation() {
    if (window.currentBatchTickets && Array.isArray(window.currentBatchTickets)) {
        const success = confirmBatchTickets(window.currentBatchTickets);
        if (success) {
            // 清除临时数据
            window.currentBatchTickets = null;
        }
        return success;
    } else {
        showCenterModal('❌ 错误', '票据数据丢失，请重新生成', 'error');
        return false;
    }
}

// 🔥 新增：确认批量投注
function confirmBatchTickets(tickets) {
    try {

        
        // 确保tickets是数组
        if (!Array.isArray(tickets) || tickets.length === 0) {
            showCenterModal('❌ 错误', '票据数据无效，请重新生成', 'error');
            return false;
        }
        
        // 计算总费用
        const totalCost = tickets.length * ticketPrice;

        
        // 检查余额
        if (accountBalance < totalCost) {
            showCenterModal('💰 余额不足', `需要¥${totalCost}，当前余额¥${accountBalance}`, 'error');
            return false;
        }
        
        // 扣除费用
        const oldBalance = accountBalance;
        accountBalance -= totalCost;
        window.accountBalance = accountBalance; // 确保全局变量同步
        

        
        // 添加到用户票据
        let successCount = 0;
        tickets.forEach((ticket, index) => {
            try {
                const userTicket = {
                    id: 'batch_ticket_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                    lotteryType: ticket.type,
                    type: ticket.type,
                    period: getCurrentPeriod(ticket.type),
                    purchaseTime: new Date().toISOString(),
                    cost: ticketPrice,
                    status: 'waiting',
                    batchId: 'batch_' + Date.now() // 批量标识
                };
                
                if (ticket.type === 'doubleColor') {
                    userTicket.numbers = ticket.red;
                    userTicket.red = ticket.red;
                    userTicket.blueNumber = ticket.blue[0];
                    userTicket.blue = ticket.blue[0];
                } else {
                    userTicket.frontNumbers = ticket.front;
                    userTicket.front = ticket.front;
                    userTicket.backNumbers = ticket.back;
                    userTicket.back = ticket.back;
                }
                
                userTickets.push(userTicket);
                successCount++;

            } catch (error) {

            }
        });
        
        // 更新统计
        stats.totalTickets += successCount;
        stats.totalSpent += totalCost;
        

        
        // 🔥 立即显示成功提示，提升用户体验
        showCenterModal('✅ 投注成功', 
            `批量投注 ${successCount} 注成功！\n总费用：¥${totalCost}\n剩余余额：¥${accountBalance}`, 
            'success');
        
        // 立即更新账户界面
        updateAccountDisplay();
        
        // 🔥 异步处理其他更新，避免阻塞
        setTimeout(() => {
            updateStatsDisplay();
            updateTicketsList();
            
            // 延迟保存数据
            setTimeout(() => {
                saveData();
            }, 100);
        }, 50);
        
        // 清除选择
        clearSelection();
        

        return true;
        
    } catch (error) {

        showCenterModal('❌ 投注失败', '处理过程中发生错误，请重试', 'error');
        return false;
    }
}

// 添加机选特效样式
function addRandomSelectStyles() {
    if (document.getElementById('randomSelectStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'randomSelectStyles';
    style.textContent = `
        .random-selecting {
            animation: gridPulse 0.5s ease-in-out infinite;
        }
        
        .ball.highlight {
            background: linear-gradient(45deg, #f39c12, #e67e22) !important;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(243, 156, 18, 0.8);
            animation: ballFlash 0.3s ease-in-out;
        }
        
        .ball.super-highlight {
            background: linear-gradient(45deg, #e74c3c, #c0392b) !important;
            transform: scale(1.2);
            box-shadow: 0 0 25px rgba(231, 76, 60, 1);
            animation: ballSuperFlash 0.3s ease-in-out;
            z-index: 10;
        }
        
        .ball.final-selected {
            animation: ballConfirm 0.6s ease-out;
        }
        
        @keyframes gridPulse {
            0%, 100% {
                box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
            }
            50% {
                box-shadow: 0 0 20px rgba(52, 152, 219, 0.6);
            }
        }
        
        @keyframes ballFlash {
            0%, 100% {
                transform: scale(1.1);
                opacity: 1;
            }
            50% {
                transform: scale(1.15);
                opacity: 0.8;
            }
        }
        
        @keyframes ballSuperFlash {
            0%, 100% {
                transform: scale(1.2);
                opacity: 1;
            }
            25% {
                transform: scale(1.3);
                opacity: 0.9;
            }
            75% {
                transform: scale(1.25);
                opacity: 0.95;
            }
        }
        
        @keyframes ballConfirm {
            0% {
                transform: scale(1);
            }
            25% {
                transform: scale(1.4) rotate(10deg);
            }
            50% {
                transform: scale(1.2) rotate(-5deg);
            }
            75% {
                transform: scale(1.3) rotate(3deg);
            }
            100% {
                transform: scale(1.1) rotate(0deg);
            }
        }
    `;
    document.head.appendChild(style);
}

// 🔥 重写数量控制函数，确保无上限
function validateAndUpdateQuantity(value) {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
        // 只检查最小值1注
        document.getElementById('betQuantity').value = 1;
        betQuantity = 1;
        showQuantityAlert('最少投注1注！');
    } else {
        // 🔥 完全无上限：接受任何大于等于1的数值
        betQuantity = numValue;

    }
    updateCostDisplay();
}

// 🔥 新增：设置自定义数量函数
function setCustomQuantity() {
    const customInput = document.getElementById('customQuantity');
    const customValue = parseInt(customInput.value);
    
    if (isNaN(customValue) || customValue < 1) {
        showQuantityAlert('请输入有效的投注数量（最少1注）！');
        customInput.focus();
        return;
    }
    
    setQuantity(customValue);
    customInput.value = ''; // 清空输入框
    
    // 显示成功提示
    showQuantityAlert(`✅ 已设置投注数量为 ${customValue} 注`);

}

// 🔥 新增：批量机选功能（备用入口）
function showBatchRandomDialog() {
    // 显示批量机选对话框
    showBatchRandomModal();
}

// 🔥 新增：显示批量机选模态框
function showBatchRandomModal() {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content batch-random">
            <div class="modal-header">
                <h3>🎲 批量机选</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="batch-options">
                    <div class="option-group">
                        <label>机选数量：</label>
                        <div class="quantity-input-group">
                            <input type="number" id="batchQuantity" min="1" value="5" placeholder="输入机选数量">
                            <span class="unit">注</span>
                        </div>
                    </div>
                    
                    <div class="option-group">
                        <label>彩票类型：</label>
                        <div class="type-selector">
                            <label class="radio-option">
                                <input type="radio" name="batchType" value="doubleColor" checked>
                                <span>🔴 双色球</span>
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="batchType" value="daletou">
                                <span>🔵 大乐透</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="quick-batch-options">
                        <h4>快速选择：</h4>
                        <div class="quick-batch-buttons">
                            <button class="quick-batch-btn" onclick="setBatchQuantity(10)">10注</button>
                            <button class="quick-batch-btn" onclick="setBatchQuantity(20)">20注</button>
                            <button class="quick-batch-btn" onclick="setBatchQuantity(50)">50注</button>
                            <button class="quick-batch-btn" onclick="setBatchQuantity(100)">100注</button>
                            <button class="quick-batch-btn" onclick="setBatchQuantity(500)">500注</button>
                            <button class="quick-batch-btn" onclick="setBatchQuantity(1000)">1000注</button>
                        </div>
                    </div>
                    
                    <div class="batch-preview">
                        <div class="preview-info">
                            <span>预计费用：¥<span id="batchCost">10</span></span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeCenterModal()">取消</button>
                <button class="btn btn-primary" onclick="executeBatchRandom()">🎲 开始批量机选</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定数量输入事件
    const batchQuantityInput = document.getElementById('batchQuantity');
    batchQuantityInput.addEventListener('input', updateBatchCost);
    
    // 初始化费用显示
    updateBatchCost();
}

// 🔥 新增：设置批量机选数量
function setBatchQuantity(quantity) {
    const batchQuantityInput = document.getElementById('batchQuantity');
    if (batchQuantityInput) {
        batchQuantityInput.value = quantity;
        updateBatchCost();
    }
}

// 🔥 新增：批量设置功能
function setBatchQuantityQuick(quantity) {
    setQuantity(quantity);
    showQuantityAlert(`快速设置: ${quantity}注`);

}

// 🔥 新增：更新批量机选费用
function updateBatchCost() {
    const batchQuantityInput = document.getElementById('batchQuantity');
    const batchCostSpan = document.getElementById('batchCost');
    
    if (batchQuantityInput && batchCostSpan) {
        const quantity = parseInt(batchQuantityInput.value) || 0;
        const cost = quantity * ticketPrice;
        batchCostSpan.textContent = cost;
    }
}

// 🔥 新增：执行批量机选
function executeBatchRandom() {
    const batchQuantityInput = document.getElementById('batchQuantity');
    const selectedType = document.querySelector('input[name="batchType"]:checked');
    
    const quantity = parseInt(batchQuantityInput.value);
    const type = selectedType ? selectedType.value : currentLotteryType;
    
    if (isNaN(quantity) || quantity < 1) {
        showQuantityAlert('请输入有效的机选数量（最少1注）！');
        return;
    }
    
    // 检查余额
    const totalCost = quantity * ticketPrice;
    if (accountBalance < totalCost) {
        showQuantityAlert(`余额不足！需要 ¥${totalCost}，当前余额 ¥${accountBalance}`);
        return;
    }
    
    // 关闭模态框
    closeCenterModal();
    
    // 切换到对应彩票类型
    if (type !== currentLotteryType) {
        switchLotteryType(type);
    }
    
    // 开始批量机选
    startBatchRandomProcess(quantity, type);
}

// 🔥 新增：批量机选处理流程
function startBatchRandomProcess(quantity, type) {
    let completedCount = 0;
    const batchTickets = [];
    
    // 显示进度提示
    showBatchProgress(0, quantity);
    
    function generateNextTicket() {
        if (completedCount >= quantity) {
            // 批量机选完成
            finishBatchRandom(batchTickets);
            return;
        }
        
        // 清除当前选择
        clearSelection();
        
        // 生成随机号码
        if (type === 'doubleColor') {
            const redNumbers = generateRandomNumbers(33, 6);
            const blueNumber = generateRandomNumbers(16, 1)[0];
            
            selectedNumbers.doubleColor.red = redNumbers;
            selectedNumbers.doubleColor.blue = [blueNumber];
        } else {
            const frontNumbers = generateRandomNumbers(35, 5);
            const backNumbers = generateRandomNumbers(12, 2);
            
            selectedNumbers.daletou.front = frontNumbers;
            selectedNumbers.daletou.back = backNumbers;
        }
        
            // 创建投注单
        const ticket = {
            id: 'ticket_' + Date.now() + '_' + Math.random(),
            lotteryType: type,
            type: type,
            period: getCurrentPeriod(type),
            purchaseTime: new Date().toISOString(),
            cost: ticketPrice,
            status: 'waiting'
        };
        
        if (type === 'doubleColor') {
            ticket.numbers = [...selectedNumbers.doubleColor.red];
            ticket.red = [...selectedNumbers.doubleColor.red];
            ticket.blueNumber = selectedNumbers.doubleColor.blue[0];
            ticket.blue = selectedNumbers.doubleColor.blue[0];
        } else {
            ticket.frontNumbers = [...selectedNumbers.daletou.front];
            ticket.front = [...selectedNumbers.daletou.front];
            ticket.backNumbers = [...selectedNumbers.daletou.back];
            ticket.back = [...selectedNumbers.daletou.back];
        }
        
        batchTickets.push(ticket);
        completedCount++;
        
        // 更新进度
        showBatchProgress(completedCount, quantity);
        
        // 继续生成下一注（添加延迟以显示进度）
        setTimeout(generateNextTicket, 50);
    }
    
    // 开始生成
    generateNextTicket();
}

// 🔥 新增：显示批量机选进度
function showBatchProgress(completed, total) {
    const progressPercent = Math.round((completed / total) * 100);
    
    // 如果进度指示器不存在，创建一个
    let progressModal = document.getElementById('batchProgressModal');
    if (!progressModal) {
        progressModal = document.createElement('div');
        progressModal.id = 'batchProgressModal';
        progressModal.className = 'center-modal';
        progressModal.innerHTML = `
            <div class="center-modal-content progress-modal">
                <div class="modal-header">
                    <h3>🎲 批量机选进行中...</h3>
                </div>
                <div class="modal-body">
                    <div class="progress-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="batchProgressFill"></div>
                        </div>
                        <div class="progress-text">
                            <span id="batchProgressText">0%</span>
                            <span id="batchProgressCount">0/0</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(progressModal);
    }
    
    // 更新进度
    const progressFill = document.getElementById('batchProgressFill');
    const progressText = document.getElementById('batchProgressText');
    const progressCount = document.getElementById('batchProgressCount');
    
    if (progressFill) progressFill.style.width = `${progressPercent}%`;
    if (progressText) progressText.textContent = `${progressPercent}%`;
    if (progressCount) progressCount.textContent = `${completed}/${total}`;
}

// 🔥 修复：完成批量机选（移除重复扣款）
function finishBatchRandom(batchTickets) {
    // 移除进度模态框
    const progressModal = document.getElementById('batchProgressModal');
    if (progressModal) {
        progressModal.remove();
    }
    
    // 🔥 不在这里扣费，因为confirmBatchTickets已经扣过了

    
    // 更新显示（不重复扣费）
    updateAccountDisplay();
    updateStatsDisplay();
    updateTicketsList();
    // 🔥 更新中奖查询页面显示
    updatePendingTicketsDisplay();
    updateWinningTicketsDisplay();
    
    // 保存数据
    saveData();
    
    
}

// 🔥 新增：显示批量机选成功提示
function showBatchSuccessAlert(count, cost) {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content success">
            <div class="modal-header">
                <h3>🎉 批量机选成功</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="success-info">
                    <div class="success-icon">✅</div>
                    <div class="success-details">
                        <p>成功生成 <strong>${count}</strong> 注彩票</p>
                        <p>总费用：<strong>¥${cost}</strong></p>
                        <p>当前余额：<strong>¥${accountBalance.toFixed(2)}</strong></p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeCenterModal()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 3秒后自动关闭
    setTimeout(() => {
        if (modal.parentNode) {
            modal.remove();
        }
    }, 3000);
}

function updateQuantityFromInput() {
    const input = document.getElementById('betQuantity');
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 1) {
        // 只检查最小值1注
        input.value = 1;
        betQuantity = 1;
        showQuantityAlert('最少投注1注！');
    } else {
        // 🔥 完全无上限：接受任何大于等于1的数值
        betQuantity = value;
        input.value = betQuantity;

    }
    
    // 添加更新动画
    input.classList.add('quantity-updated');
    setTimeout(() => {
        input.classList.remove('quantity-updated');
    }, 300);
    
    updateCostDisplay();
    playQuantitySetSound();
}

function adjustQuantity(change) {
    const input = document.getElementById('betQuantity');
    const newValue = parseInt(input.value) + change;
    
    if (newValue >= 1) {
        // ✅ 完全移除上限限制
        betQuantity = newValue;
        input.value = betQuantity;
        
        // 添加更新动画
        input.classList.add('quantity-updated');
        setTimeout(() => {
            input.classList.remove('quantity-updated');
        }, 300);
        
        updateCostDisplay();
        playQuantityAdjustSound();

    } else {
        playLimitSound();
        showQuantityAlert('最少投注1注！');
        
        // 摇晃动画表示无效操作
        const btn = document.querySelector('.quantity-btn-new.minus');
        if (btn) {
            btn.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                btn.style.animation = '';
            }, 500);
        }
    }
}

function setQuantity(quantity) {
    // ✅ 完全移除上限限制
    if (quantity >= 1) {
        betQuantity = quantity;
        const betQuantityInput = document.getElementById('betQuantity');
        if (betQuantityInput) {
            betQuantityInput.value = betQuantity;
            
            // 添加更新动画
            betQuantityInput.classList.add('quantity-updated');
            setTimeout(() => {
                betQuantityInput.classList.remove('quantity-updated');
            }, 300);
        }
        
        updateCostDisplay();
        playQuantitySetSound();

        
        // 显示成功提示（仅大数量时）
        if (quantity >= 100) {
            showQuantityAlert(`已设置投注数量为 ${quantity} 注`);
        }
        
        // 高亮当前选中的快捷按钮
        setTimeout(() => {
            try {
                document.querySelectorAll('.quick-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                const targetBtn = document.querySelector(`[onclick="setQuantity(${quantity})"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                    
                    setTimeout(() => {
                        targetBtn.classList.remove('active');
                    }, 1500);
                }
            } catch (error) {

            }
        }, 10);
    } else {
        showQuantityAlert('最少投注1注！');
    }
}

// 🔥 新增：叠加投注数量函数
function addQuantity(amount) {
    if (amount >= 1) {
        const currentValue = parseInt(document.getElementById('betQuantity').value) || 0;
        const newQuantity = currentValue + amount;
        
        // 设置新的数量
        betQuantity = newQuantity;
        const betQuantityInput = document.getElementById('betQuantity');
        if (betQuantityInput) {
            betQuantityInput.value = betQuantity;
            
            // 添加叠加动画效果
            betQuantityInput.classList.add('quantity-add-animation');
            setTimeout(() => {
                betQuantityInput.classList.remove('quantity-add-animation');
            }, 600);
        }
        
        if (typeof updateCostDisplay === 'function') {
            updateCostDisplay();
        }
        if (typeof playQuantitySetSound === 'function') {
            playQuantitySetSound();
        }
        

        
        // 显示叠加提示
        if (amount >= 100) {
            if (typeof showQuantityAlert === 'function') {
                showQuantityAlert(`已叠加 +${amount} 注\n当前总投注: ${betQuantity} 注`);
            }
        }
        
        // 添加视觉反馈
        showAddQuantityFeedback(amount);
    }
}

// 🔥 新增：显示叠加数量的视觉反馈
function showAddQuantityFeedback(amount) {
    const input = document.getElementById('betQuantity');
    if (!input) return;
    
    // 创建浮动提示
    const feedback = document.createElement('div');
    feedback.className = 'quantity-add-feedback';
    feedback.textContent = `+${amount}`;
    feedback.style.cssText = `
        position: absolute;
        top: -30px;
        right: 10px;
        background: #27ae60;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        z-index: 1000;
        animation: quantityFeedback 1.5s ease-out forwards;
        pointer-events: none;
    `;
    
    // 添加到输入框的父容器
    const container = input.parentElement;
    if (container) {
        container.style.position = 'relative';
        container.appendChild(feedback);
        
        // 1.5秒后移除
        setTimeout(() => {
            if (feedback.parentElement) {
                feedback.parentElement.removeChild(feedback);
            }
        }, 1500);
    }
}

// 🔥 新增：重置投注数量函数
function resetQuantity() {
    betQuantity = 1;
    const betQuantityInput = document.getElementById('betQuantity');
    if (betQuantityInput) {
        betQuantityInput.value = betQuantity;
    }
    
    if (typeof updateCostDisplay === 'function') {
        updateCostDisplay();
    }
    

}

function updateCostDisplay() {
    const totalCost = betQuantity * ticketPrice;
    const costElement = document.getElementById('totalCost');
    if (costElement) {
        costElement.textContent = totalCost; // 只显示数字，不要其他内容
        
        // 添加费用更新动画
        costElement.classList.add('cost-updated');
        setTimeout(() => {
            costElement.classList.remove('cost-updated');
        }, 400);
    }
}

// 确认投注 - 优化为居中弹窗
function confirmTicket() {
    let isValid = false;
    let ticketData = {};
    
    if (currentLotteryType === 'doubleColor') {
        isValid = selectedNumbers.doubleColor.red.length === 6 && selectedNumbers.doubleColor.blue.length === 1;
        if (isValid) {
            ticketData = {
                type: 'doubleColor',
                lotteryType: 'doubleColor',
                numbers: [...selectedNumbers.doubleColor.red],
                red: [...selectedNumbers.doubleColor.red],
                blueNumber: selectedNumbers.doubleColor.blue[0],
                blue: selectedNumbers.doubleColor.blue[0],
                quantity: betQuantity,
                totalCost: betQuantity * ticketPrice
            };
        }
    } else {
        isValid = selectedNumbers.daletou.front.length === 5 && selectedNumbers.daletou.back.length === 2;
        if (isValid) {
            ticketData = {
                type: 'daletou',
                lotteryType: 'daletou',
                frontNumbers: [...selectedNumbers.daletou.front],
                front: [...selectedNumbers.daletou.front],
                backNumbers: [...selectedNumbers.daletou.back],
                back: [...selectedNumbers.daletou.back],
                quantity: betQuantity,
                totalCost: betQuantity * ticketPrice
            };
        }
    }
    
    if (!isValid) {
        showCenterModal('⚠️ 选号提醒', '请先完成选号！', 'warning');
        return;
    }
    
    if (accountBalance < ticketData.totalCost) {
        showCenterModal('💰 余额不足', `需要¥${ticketData.totalCost}，当前余额¥${accountBalance}`, 'error');
        return;
    }
    
    showBetConfirmationModal(ticketData);
}

// 新增：显示居中弹窗
function showCenterModal(title, message, type = 'info') {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content ${type}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeCenterModal()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCenterModalStyles();
}

// 新增：投注确认弹窗
function showBetConfirmationModal(ticketData) {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content confirmation">
            <div class="modal-header">
                <h3>📋 确认投注</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span class="label">彩票类型：</span>
                        <span class="value">${ticketData.type === 'doubleColor' ? '🔴 双色球' : '🔵 大乐透'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">选择号码：</span>
                        <div class="value numbers-display">
                            ${formatTicketNumbersForConfirm(ticketData)}
                        </div>
                    </div>
                    <div class="detail-row">
                        <span class="label">投注数量：</span>
                        <span class="value highlight">${ticketData.quantity} 注</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">单注金额：</span>
                        <span class="value">¥${ticketPrice}</span>
                    </div>
                    <div class="detail-row total">
                        <span class="label">总金额：</span>
                        <span class="value total-amount">¥${ticketData.totalCost}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">当前余额：</span>
                        <span class="value">¥${accountBalance}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">投注后余额：</span>
                        <span class="value">¥${accountBalance - ticketData.totalCost}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="processBet(${JSON.stringify(ticketData).replace(/"/g, '&quot;')}); closeCenterModal()">✅ 确认投注</button>
                <button class="btn btn-secondary" onclick="closeCenterModal()">❌ 取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCenterModalStyles();
}

// 关闭居中弹窗
function closeCenterModal() {
    const modals = document.querySelectorAll('.center-modal');
    modals.forEach(modal => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => modal.remove(), 300);
    });
}

// 添加居中弹窗样式
function addCenterModalStyles() {
    if (document.getElementById('centerModalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'centerModalStyles';
    style.textContent = `
        .center-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modalFadeIn 0.3s ease-out;
        }
        
        .center-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }
        
        .center-modal-content {
            position: relative;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease-out;
        }
        
        .center-modal-content.warning {
            border-top: 5px solid #f39c12;
        }
        
        .center-modal-content.error {
            border-top: 5px solid #e74c3c;
        }
        
        .center-modal-content.confirmation {
            border-top: 5px solid #3498db;
        }
        
        .center-modal-content.batch-random {
            border-top: 5px solid #9b59b6;
            max-width: 600px;
        }
        
        .center-modal-content.progress-modal {
            border-top: 5px solid #f39c12;
            max-width: 400px;
        }
        
        .center-modal-content.success {
            border-top: 5px solid #27ae60;
        }
        
        .batch-options {
            text-align: left;
        }
        
        .option-group {
            margin: 20px 0;
        }
        
        .option-group label {
            display: block;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }
        
        .quantity-input-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .quantity-input-group input {
            flex: 1;
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1em;
        }
        
        .quantity-input-group .unit {
            color: #7f8c8d;
            font-weight: bold;
        }
        
        .type-selector {
            display: flex;
            gap: 20px;
        }
        
        .radio-option {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        
        .radio-option:hover {
            border-color: #3498db;
            background: #f8f9fa;
        }
        
        .radio-option input[type="radio"] {
            margin: 0;
        }
        
        .quick-batch-options h4 {
            margin: 15px 0 10px 0;
            color: #2c3e50;
        }
        
        .quick-batch-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .quick-batch-btn {
            padding: 10px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: bold;
        }
        
        .quick-batch-btn:hover {
            border-color: #9b59b6;
            background: #f8f9fa;
            transform: translateY(-2px);
        }
        
        .batch-preview {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        
        .preview-info {
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
            font-size: 1.1em;
        }
        
        .progress-container {
            text-align: center;
        }
        
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #f39c12, #e67e22);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .progress-text {
            display: flex;
            justify-content: space-between;
            color: #2c3e50;
            font-weight: bold;
        }
        
        .success-info {
            text-align: center;
        }
        
        .success-icon {
            font-size: 3em;
            margin-bottom: 15px;
        }
        
        .success-details p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        
        .modal-header {
            padding: 20px 25px 15px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.3em;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5em;
            color: #7f8c8d;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .close-btn:hover {
            background: #e9ecef;
            color: #2c3e50;
        }
        
        .modal-body {
            padding: 20px 25px;
        }
        
        .modal-body p {
            margin: 0;
            color: #2c3e50;
            line-height: 1.6;
            text-align: center;
        }
        
        .confirmation-details {
            text-align: left;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-row.total {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            margin: 10px -10px;
            padding: 15px 10px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .detail-row .label {
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .detail-row .value {
            color: #2c3e50;
            font-weight: 600;
        }
        
        .detail-row .value.highlight {
            color: #e74c3c;
            font-size: 1.1em;
        }
        
        .detail-row .value.total-amount {
            color: #f39c12;
            font-size: 1.2em;
        }
        
        .numbers-display {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
        
        .confirm-ball {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8em;
        }
        
        .modal-footer {
            padding: 15px 25px 20px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .modal-footer .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-footer .btn-primary {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
        }
        
        .modal-footer .btn-primary:hover {
            background: linear-gradient(45deg, #229954, #27ae60);
            transform: translateY(-2px);
        }
        
        .modal-footer .btn-secondary {
            background: linear-gradient(45deg, #95a5a6, #bdc3c7);
            color: white;
        }
        
        .modal-footer .btn-secondary:hover {
            background: linear-gradient(45deg, #7f8c8d, #95a5a6);
            transform: translateY(-2px);
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// 处理投注
function processBet(ticketData) {
    // 🔥 立即显示投注成功，提升用户体验
    showBetSuccessAlert(ticketData);
    
    // 🔥 立即更新余额和界面
    accountBalance -= ticketData.totalCost;
    updateAccountDisplay();
    clearSelection();
    
    // 🔥 异步处理数据保存，避免阻塞
    requestAnimationFrame(() => {
        for (let i = 0; i < ticketData.quantity; i++) {
            const ticket = {
                id: 'ticket_' + Date.now() + '_' + i,
                lotteryType: ticketData.type,
                type: ticketData.type,
                period: getCurrentPeriod(),
                purchaseTime: new Date().toISOString(),
                cost: ticketPrice,
                status: 'waiting'
            };
            
            if (ticketData.type === 'doubleColor') {
                ticket.numbers = ticketData.numbers;
                ticket.red = ticketData.numbers;
                ticket.blueNumber = ticketData.blueNumber;
                ticket.blue = ticketData.blueNumber;
            } else {
                ticket.frontNumbers = ticketData.frontNumbers;
                ticket.front = ticketData.frontNumbers;
                ticket.backNumbers = ticketData.backNumbers;
                ticket.back = ticketData.backNumbers;
            }
            
            userTickets.push(ticket);
        }
        
        stats.totalTickets += ticketData.quantity;
        stats.totalSpent += ticketData.totalCost;
        
        // 🔥 分批更新界面，避免一次性处理太多
        updateStatsDisplay();
        
        setTimeout(() => {
            updateTicketsList();
            updatePendingTicketsDisplay();
            updateWinningTicketsDisplay();
            
            // 🔥 延迟保存数据，避免阻塞用户操作
            setTimeout(() => {
                saveData();
            }, 100);
        }, 50);
    });
}

// 显示投注成功提示
function showBetSuccessAlert(ticketData) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #27ae60, #2ecc71);
        color: white;
        padding: 20px 30px;
        border-radius: 25px;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(39, 174, 96, 0.3);
        z-index: 1000;
        text-align: center;
        animation: successPulse 0.6s ease-out;
    `;
    alert.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">🎉 投注成功！</h3>
        <p style="margin: 5px 0;">投注数量：${ticketData.quantity}注</p>
        <p style="margin: 5px 0;">总金额：¥${ticketData.totalCost}</p>
        <p style="margin: 5px 0;">祝您好运！🍀</p>
    `;
    
    document.body.appendChild(alert);
    playBetSuccessSound();
    
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

// 切换标签页 - 增加阴影跟随效果
function showTab(tabName) {
    try {
        // 隐藏所有标签内容
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // 移除所有标签按钮的激活状态
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示选中的标签内容
        const targetTab = safeGetElement(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // 安全地激活对应的标签按钮
        try {
            const activeBtn = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
            if (activeBtn) {
                activeBtn.classList.add('active');
            }
        } catch (btnError) {

        }
        
        // 更新导航指示器位置（阴影跟随）
        safeCall(updateNavIndicator, null, tabName);
        
        // 特殊处理
        if (tabName === 'check') {
            safeCall(checkAllTickets);
        } else if (tabName === 'account') {
            safeCall(updateStatsDisplay);
        }
    } catch (error) {

        if (statusIndicator) {
            statusIndicator.show('页面切换失败', 'error', 2000);
        }
    }
}

// 更新导航指示器 - 阴影跟随效果
function updateNavIndicator(tabName) {
    const tabs = ['selection', 'draw', 'history', 'check', 'account']; // 🔥 更新为5个标签
    const index = tabs.indexOf(tabName);
    if (index !== -1) {
        // 移除旧样式
        const oldStyle = document.getElementById('navIndicatorStyle');
        if (oldStyle) oldStyle.remove();
        
        // 添加新样式
        const style = document.createElement('style');
        style.id = 'navIndicatorStyle';
        style.textContent = `
            .nav-tabs::before {
                transform: translateX(${index * 100}%);
            }
            .nav-tabs::after {
                transform: translateX(${index * 100}%);
            }
        `;
        document.head.appendChild(style);
    }
}

// 🔥 新增：切换开奖历史类型
function switchHistoryType(type) {
    try {
        // 隐藏所有历史列表
        document.querySelectorAll('.history-list').forEach(list => {
            list.classList.remove('active');
        });
        
        // 移除所有按钮的激活状态
        document.querySelectorAll('.history-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 显示对应的历史列表
        const targetList = document.getElementById(`${type}History`);
        if (targetList) {
            targetList.classList.add('active');
        }
        
        // 激活对应的按钮
        const activeBtn = document.querySelector(`[onclick*="switchHistoryType('${type}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 加载对应类型的历史记录
        loadHistoryData(type);
        

    } catch (error) {

    }
}

// 🔥 新增：加载历史记录数据
function loadHistoryData(type) {
    try {
        const container = document.getElementById(`${type}History`);
        if (!container) {
            // 如果容器不存在，可能是DOM还没加载完成，稍后重试

            setTimeout(() => {
                const retryContainer = document.getElementById(`${type}History`);
                if (retryContainer) {
                    loadHistoryData(type);
                }
            }, 1000);
            return;
        }
        
        // 获取对应类型的开奖结果
        const results = drawResults[type] || [];
        
        if (results.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: rgba(255,255,255,0.8);">
                    <p style="font-size: 18px; margin-bottom: 10px;">📊</p>
                    <p>暂无${type === 'doubleColor' ? '双色球' : '大乐透'}历史记录</p>
                    <p style="font-size: 12px; opacity: 0.7; margin-top: 8px;">请先进行开奖</p>
                </div>
            `;
            return;
        }
        
        // 按时间倒序排列，最新的在前
        const sortedResults = [...results].reverse();
        
        const historyHTML = sortedResults.map((result, index) => {
            // 🔥 修复：使用result中的实际时间和期号
            const date = result.drawTime ? new Date(result.drawTime).toLocaleDateString() : new Date().toLocaleDateString();
            const time = result.drawTime ? new Date(result.drawTime).toLocaleTimeString() : new Date().toLocaleTimeString();
            const period = result.period || `第${results.length - index}期`;
            
            return createHistoryItemHTML(result, date, time, period, type);
        }).join('');
        
        container.innerHTML = historyHTML;
        

    } catch (error) {

        const container = document.getElementById(`${type}History`);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #e74c3c;">
                    <p>❌ 历史记录加载失败</p>
                    <p style="font-size: 12px; margin-top: 8px;">${error.message}</p>
                </div>
            `;
        }
    }
}

// 🔥 新增：创建历史记录项HTML
function createHistoryItemHTML(result, date, time, period, type) {
    let numbers = [];
    let specialNumbers = [];
    
    // 🔥 修复：根据彩票类型获取正确的号码数据
    if (type === 'doubleColor') {
        // 双色球：红球 + 蓝球
        numbers = result.numbers || result.red || [];
        specialNumbers = result.blueNumber ? [result.blueNumber] : (result.blue ? [result.blue] : []);
    } else {
        // 大乐透：前区 + 后区
        numbers = result.frontNumbers || result.front || [];
        specialNumbers = result.backNumbers || result.back || [];
    }
    
    // 生成号码球HTML
    const numbersHTML = numbers.map(num => 
        `<div class="history-ball ${type === 'doubleColor' ? 'red-ball' : 'front-ball'}">${num.toString().padStart(2, '0')}</div>`
    ).join('');
    
    const specialHTML = specialNumbers.map(num => 
        `<div class="history-ball ${type === 'doubleColor' ? 'blue-ball' : 'back-ball'}">${num.toString().padStart(2, '0')}</div>`
    ).join('');
    
    const typeLabel = type === 'doubleColor' ? '双色球' : '大乐透';
    const numberLabel = type === 'doubleColor' ? '红球' : '前区';
    const specialLabel = type === 'doubleColor' ? '蓝球' : '后区';
    
    return `
        <div class="history-item">
            <div class="history-item-header">
                <span class="history-period">${typeLabel} ${period}</span>
                <span class="history-date">${date} ${time}</span>
            </div>
            <div class="history-numbers">
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">${numberLabel}:</span>
                ${numbersHTML}
                <span class="history-separator">|</span>
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">${specialLabel}:</span>
                ${specialHTML}
            </div>
        </div>
    `;
}

// 生成随机不重复数字
function generateRandomNumbers(max, count) {
    const numbers = [];
    while (numbers.length < count) {
        const num = Math.floor(Math.random() * max) + 1;
        if (!numbers.includes(num)) {
            numbers.push(num);
        }
    }
    return numbers.sort((a, b) => a - b);
}

// 获取当前期号
function getCurrentPeriod(type = currentDrawType) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 根据彩票类型生成不同的期号格式
    if (type === 'doubleColor') {
        return `${year}${month}${day}-DC`;
    } else {
        return `${year}${month}${day}-DLT`;
    }
}

// 格式化投注确认中的号码显示
function formatTicketNumbersForConfirm(ticketData) {
    if (ticketData.type === 'doubleColor') {
        return `
            ${ticketData.numbers.map(num => `<span class="confirm-ball red-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            <span class="confirm-ball blue-ball">${ticketData.blueNumber}</span>
        `;
    } else {
        return `
            ${ticketData.frontNumbers.map(num => `<span class="confirm-ball front-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            ${ticketData.backNumbers.map(num => `<span class="confirm-ball back-ball">${num}</span>`).join('')}
        `;
    }
}

// 格式化彩票号码
function formatTicketNumbers(ticket) {
    if (ticket.lotteryType === 'doubleColor') {
        const red = ticket.numbers || ticket.red || [];
        const blue = ticket.blueNumber || ticket.blue;
        return `
            ${red.map(num => `<span class="ticket-ball red-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            <span class="ticket-ball blue-ball">${blue}</span>
        `;
    } else {
        const front = ticket.frontNumbers || ticket.front || [];
        const back = ticket.backNumbers || ticket.back || [];
        return `
            ${front.map(num => `<span class="ticket-ball front-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            ${back.map(num => `<span class="ticket-ball back-ball">${num}</span>`).join('')}
        `;
    }
}

// 获取状态文本
function getStatusText(status) {
    const statusMap = {
        waiting: '等待开奖',
        won: '已中奖',
        lost: '未中奖',
        claimed: '已兑奖'
    };
    return statusMap[status] || '未知状态';
}

// 更新账户显示
function updateAccountDisplay() {
    try {
        // 🔥 确保余额同步
        if (typeof window.accountBalance !== 'number') {
            window.accountBalance = parseFloat(window.accountBalance) || 1000;
        }
        accountBalance = window.accountBalance;
        
        const balanceElement = safeGetElement('accountBalance');
        if (balanceElement) {
            balanceElement.textContent = `¥ ${window.accountBalance.toFixed(2)}`;
            
            // 🔥 添加更新动画
            balanceElement.style.animation = 'none';
            balanceElement.offsetHeight;
            balanceElement.style.animation = 'balanceUpdate 0.6s ease-out';
        }
        
        // 🔥 更新所有余额显示元素
        const allBalanceElements = document.querySelectorAll('[data-balance], .account-balance, .balance-display, .current-balance');
        allBalanceElements.forEach(element => {
            if (element) {
                element.textContent = `¥${window.accountBalance.toFixed(2)}`;
            }
        });
        

    } catch (error) {

    }
}

// 更新统计信息
function updateStatsDisplay() {
    try {
        const elements = {
            totalTickets: safeGetElement('totalTickets'),
            totalWins: safeGetElement('totalWins'),
            totalSpent: safeGetElement('totalSpent'),
            totalWinnings: safeGetElement('totalWinnings')
        };
        
        if (elements.totalTickets) elements.totalTickets.textContent = stats.totalTickets;
        if (elements.totalWins) elements.totalWins.textContent = stats.totalWins;
        if (elements.totalSpent) elements.totalSpent.textContent = `¥${stats.totalSpent}`;
        if (elements.totalWinnings) elements.totalWinnings.textContent = `¥${stats.totalWinnings}`;
    } catch (error) {

    }
}

// 🔥 修复：添加缺失的updatePrizeTable函数
function updatePrizeTable() {
    try {
        const prizeTableBody = document.getElementById('prizeTableBody');
        if (!prizeTableBody) {
            console.log('奖金表元素不存在，跳过更新');
            return;
        }
        
        let tableHTML = '';
        
        if (currentDrawType === 'doubleColor') {
            tableHTML = `
                <tr><td>一等奖</td><td>6+1</td><td>¥5,000,000</td></tr>
                <tr><td>二等奖</td><td>6+0</td><td>¥100,000</td></tr>
                <tr><td>三等奖</td><td>5+1</td><td>¥3,000</td></tr>
                <tr><td>四等奖</td><td>5+0 或 4+1</td><td>¥200</td></tr>
                <tr><td>五等奖</td><td>4+0 或 3+1</td><td>¥10</td></tr>
                <tr><td>六等奖</td><td>2+1 或 1+1 或 0+1</td><td>¥5</td></tr>
            `;
        } else {
            tableHTML = `
                <tr><td>一等奖</td><td>5+2</td><td>¥10,000,000</td></tr>
                <tr><td>二等奖</td><td>5+1</td><td>¥200,000</td></tr>
                <tr><td>三等奖</td><td>5+0</td><td>¥10,000</td></tr>
                <tr><td>四等奖</td><td>4+2</td><td>¥3,000</td></tr>
                <tr><td>五等奖</td><td>4+1</td><td>¥300</td></tr>
                <tr><td>六等奖</td><td>3+2</td><td>¥200</td></tr>
                <tr><td>七等奖</td><td>4+0</td><td>¥100</td></tr>
                <tr><td>八等奖</td><td>3+1 或 2+2</td><td>¥15</td></tr>
                <tr><td>九等奖</td><td>3+0 或 2+1 或 1+2</td><td>¥5</td></tr>
            `;
        }
        
        prizeTableBody.innerHTML = tableHTML;
        console.log('✅ 奖金表更新完成');
    } catch (error) {
        console.error('❌ 更新奖金表失败:', error);
    }
}

// 添加updateStats函数的别名以保持兼容性
function updateStats() {
    updateStatsDisplay();
}

// 🚀 性能优化：更新投注单列表（虚拟化 + 防抖）
let updateTicketsDebounce = null;

function updateTicketsList() {
    // 防抖处理，避免频繁更新
    if (updateTicketsDebounce) {
        clearTimeout(updateTicketsDebounce);
    }
    
    updateTicketsDebounce = setTimeout(() => {
        updateTicketsListInternal();
    }, 16); // 约60fps的更新频率
}

function updateTicketsListInternal() {
    try {
        const container = safeGetElement('ticketsList');
        if (!container) return;
        
        if (userTickets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">暂无投注记录</p>';
            return;
        }
        
        // 🚀 性能优化：只渲染可见区域的票据（虚拟化思想）
        const maxVisible = 50; // 最多显示50条记录
        const ticketsToShow = userTickets.slice(-maxVisible).reverse(); // 显示最新的记录在前
        
        // 使用DocumentFragment批量创建
        const fragment = document.createDocumentFragment();
        
        // 分批渲染，避免长任务
        const batchSize = 10;
        let processed = 0;
        
        function renderBatch() {
            const start = processed;
            const end = Math.min(processed + batchSize, ticketsToShow.length);
            
            for (let i = start; i < end; i++) {
                const ticket = ticketsToShow[i];
                const ticketElement = document.createElement('div');
                ticketElement.className = `ticket-item ${ticket.status}`;
                ticketElement.innerHTML = `
                <div class="ticket-header">
                    <span class="ticket-type">${ticket.lotteryType === 'doubleColor' ? '双色球' : '大乐透'}</span>
                    <span class="ticket-status">${getStatusText(ticket.status)}</span>
                </div>
                <div class="ticket-numbers">
                    ${formatTicketNumbers(ticket)}
                </div>
                <div class="ticket-info">
                    <span>期号: ${ticket.period}</span>
                    <span>金额: ¥${ticket.cost}</span>
                    <span>时间: ${new Date(ticket.purchaseTime).toLocaleString()}</span>
                </div>
                `;
                fragment.appendChild(ticketElement);
                processed++;
            }
            
            if (processed < ticketsToShow.length) {
                requestAnimationFrame(renderBatch);
            } else {
                // 清空容器并添加所有元素
                container.innerHTML = '';
                container.appendChild(fragment);
                
                // 添加滚动提示
                addScrollHint(container);
            }
        }
        
        renderBatch();
        
    } catch (error) {

    }
}

// 添加滚动提示的辅助函数
function addScrollHint(container) {
    if (userTickets.length > 3) {
        const scrollHint = document.createElement('div');
        scrollHint.style.cssText = `
            text-align: center;
            font-size: 12px;
            color: #999;
            padding: 5px;
            background: #f8f9fa;
            border-top: 1px solid #e9ecef;
            position: sticky;
            bottom: 0;
            margin: 0 -10px -10px -10px;
        `;
        
        const totalCount = userTickets.length;
        const displayCount = Math.min(50, totalCount);
        
        scrollHint.textContent = totalCount > 50 
            ? `显示最新${displayCount}条记录，共${totalCount}条，可滚动查看`
            : `共${totalCount}条记录，可滚动查看更多`;
            
        container.appendChild(scrollHint);
    }
}

// 显示选择限制提示
function showSelectionLimitAlert(ballType) {
    const limits = {
        red: '红球最多选择6个',
        blue: '蓝球只能选择1个',
        front: '前区最多选择5个',
        back: '后区最多选择2个'
    };
    
    showCenterModal('⚠️ 选号限制', limits[ballType], 'warning');
}

// 显示数量限制警告
function showQuantityAlert(message) {
    showCenterModal('⚠️ 投注提醒', message, 'warning');
}

// 关闭模态框
function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => modal.remove());
}

// 数据存储
function saveData() {
    try {
        // 🔥 确保accountBalance是数字类型
        if (typeof window.accountBalance !== 'number') {
            window.accountBalance = parseFloat(window.accountBalance) || 1000;
        }
        
        // 🔥 优化数据存储：清理过期和不必要的数据
        cleanupStorageData();
        
        localStorage.setItem('lotteryUserTickets', JSON.stringify(userTickets));
        localStorage.setItem('lotteryAccountBalance', window.accountBalance.toString());
        localStorage.setItem('lotteryStats', JSON.stringify(stats));
        localStorage.setItem('lotteryDrawResults', JSON.stringify(drawResults));
        
        // 🔥 新增：同步保存全局余额
        localStorage.setItem('globalAccountBalance', window.accountBalance.toString());
        
        console.log('💾 主系统数据已保存，余额:', window.accountBalance);
    } catch (error) {
        console.error('保存数据失败:', error);
        
        // 🔥 存储空间不足时的处理
        if (error.name === 'QuotaExceededError') {
            handleStorageQuotaExceeded();
        }
    }
}

// 🔥 新增：清理存储数据
function cleanupStorageData() {
    try {
        const currentTime = new Date();
        const thirtyDaysAgo = new Date(currentTime.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        // 🔥 清理超过30天的投注记录，只保留中奖的
        const filteredTickets = userTickets.filter(ticket => {
            const ticketDate = new Date(ticket.purchaseTime);
            const isRecent = ticketDate > thirtyDaysAgo;
            const isWinning = ticket.status === 'winning';
            return isRecent || isWinning;
        });
        
        // 🔥 如果清理后数据量仍然很大，进一步优化
        if (filteredTickets.length > 1000) {
            // 只保留最近的500条记录和所有中奖记录
            const winningTickets = filteredTickets.filter(t => t.status === 'winning');
            const recentTickets = filteredTickets
                .filter(t => t.status !== 'winning')
                .sort((a, b) => new Date(b.purchaseTime) - new Date(a.purchaseTime))
                .slice(0, 500);
            
            userTickets = [...winningTickets, ...recentTickets];
        } else {
            userTickets = filteredTickets;
        }
        
        // 🔥 清理开奖历史，只保留最近的100条
        Object.keys(drawResults).forEach(type => {
            if (drawResults[type].length > 100) {
                drawResults[type] = drawResults[type]
                    .sort((a, b) => new Date(b.drawTime) - new Date(a.drawTime))
                    .slice(0, 100);
            }
        });
        
        console.log(`🧹 数据清理完成，投注记录: ${userTickets.length} 条`);
    } catch (error) {
        console.error('❌ 数据清理失败:', error);
    }
}

// 🔥 新增：处理存储配额超限
function handleStorageQuotaExceeded() {
    try {
        console.warn('⚠️ 存储空间不足，开始紧急清理...');
        
        // 🔥 紧急清理：只保留最近的100条记录和中奖记录
        const winningTickets = userTickets.filter(t => t.status === 'winning');
        const recentTickets = userTickets
            .filter(t => t.status !== 'winning')
            .sort((a, b) => new Date(b.purchaseTime) - new Date(a.purchaseTime))
            .slice(0, 100);
        
        userTickets = [...winningTickets, ...recentTickets];
        
        // 🔥 大幅减少开奖历史
        Object.keys(drawResults).forEach(type => {
            drawResults[type] = drawResults[type]
                .sort((a, b) => new Date(b.drawTime) - new Date(a.drawTime))
                .slice(0, 20);
        });
        
        // 🔥 尝试重新保存
        try {
            localStorage.setItem('lotteryUserTickets', JSON.stringify(userTickets));
            localStorage.setItem('lotteryStats', JSON.stringify(stats));
            localStorage.setItem('lotteryDrawResults', JSON.stringify(drawResults));
            localStorage.setItem('lotteryAccountBalance', window.accountBalance.toString());
            localStorage.setItem('globalAccountBalance', window.accountBalance.toString());
            
            console.log('✅ 紧急清理完成，数据重新保存成功');
            
            // 🔥 提示用户
            showCenterModal('📁 存储优化', '系统已自动清理历史数据以释放存储空间，不影响您的余额和中奖记录！', 'info');
        } catch (retryError) {
            console.error('❌ 紧急清理后仍无法保存:', retryError);
            showCenterModal('⚠️ 存储问题', '存储空间不足，部分数据可能无法保存。建议清理浏览器缓存。', 'warning');
        }
    } catch (error) {
        console.error('❌ 处理存储配额超限失败:', error);
    }
}

// 加载数据
function loadData() {
    try {
        const savedTickets = localStorage.getItem('lotteryUserTickets');
        if (savedTickets) {
            userTickets = JSON.parse(savedTickets);
        }
        
        // 🔥 优先从全局余额加载
        const globalBalance = localStorage.getItem('globalAccountBalance');
        const savedBalance = localStorage.getItem('lotteryAccountBalance');
        
        if (globalBalance) {
            window.accountBalance = parseFloat(globalBalance);
            accountBalance = window.accountBalance;
        } else if (savedBalance) {
            window.accountBalance = parseFloat(savedBalance);
            accountBalance = window.accountBalance;
        } else {
            window.accountBalance = 1000;
            accountBalance = 1000;
        }
        
        const savedStats = localStorage.getItem('lotteryStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
        }
        
        const savedDrawResults = localStorage.getItem('lotteryDrawResults');
        if (savedDrawResults) {
            drawResults = JSON.parse(savedDrawResults);
        }
        
        console.log('📂 主系统数据已加载，余额:', window.accountBalance);
        
        // 🔥 初始化中奖查询页面显示
        setTimeout(() => {
            updatePendingTicketsDisplay();
            updateWinningTicketsDisplay();
            
            // 🔥 添加示例大乐透记录（仅在没有记录时）
            addSampleDaletouHistory();
            
            // 🔥 添加示例中奖记录（仅在没有记录时）
            addSampleWinningTickets();
        }, 100);
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 🔥 强制移除投注数量限制
document.addEventListener('DOMContentLoaded', function() {
    // 移除input的max属性
    const betQuantityInput = document.getElementById('betQuantity');
    if (betQuantityInput) {
        betQuantityInput.removeAttribute('max');
        betQuantityInput.setAttribute('min', '1');

    }
});

// 🔥 自定义数量输入验证
function setupCustomQuantityValidation() {
    const customInput = document.getElementById('customQuantity');
    if (!customInput) return;
    
    customInput.addEventListener('input', function() {
        const value = parseInt(this.value);
        
        // 移除之前的样式
        this.classList.remove('valid', 'invalid');
        
        if (this.value === '') {
            return;
        }
        
        // 验证输入值
        if (isNaN(value) || value < 1) {
            this.classList.add('invalid');
            this.title = '请输入有效的数字（最小为1）';
        } else if (value > 99999) {
            this.classList.add('invalid');
            this.title = '数量不能超过99999';
            this.value = '99999'; // 自动限制最大值
        } else {
            this.classList.add('valid');
            this.title = '输入有效';
        }
    });
    
    // 限制只能输入数字
    customInput.addEventListener('keypress', function(e) {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
            e.preventDefault();
        }
    });
    
    // 粘贴验证
    customInput.addEventListener('paste', function(e) {
        setTimeout(() => {
            const value = parseInt(this.value);
            if (isNaN(value) || value < 1) {
                this.value = '';
            } else if (value > 99999) {
                this.value = '99999';
            }
        }, 10);
    });
}

// 页面加载管理
class PageLoader {
    constructor() {
        this.createLoader();
        this.startLoading();
    }
    
    createLoader() {
        // 页面加载器已在HTML中定义
    }
    
    startLoading() {
        const messages = [
            '🎲 初始化彩票系统...',
            '🎯 加载选号界面...',
            '🎱 准备开奖系统...',
            '🏆 配置中奖检测...',
            '💰 设置兑奖中心...',
            '✨ 完成加载！'
        ];
        
        let index = 0;
        const textElement = document.querySelector('.loader-text');
        
        const interval = setInterval(() => {
            if (index < messages.length && textElement) {
                textElement.textContent = messages[index];
                index++;
            } else {
                clearInterval(interval);
                setTimeout(() => this.hideLoader(), 500);
            }
        }, 400);
    }
    
    hideLoader() {
        const loader = document.querySelector('.page-loader');
        if (loader) {
            loader.style.animation = 'fadeOut 0.5s ease-out forwards';
            setTimeout(() => loader.remove(), 500);
        }
    }
}

// 🔥 增强开奖大厅交互效果
function enhanceDrawHallInteractions() {
    // 倒计时数字跳动效果
    const countdownNumbers = document.querySelectorAll('.countdown-number');
    countdownNumbers.forEach(number => {
        number.addEventListener('animationend', () => {
            number.style.animation = 'none';
            setTimeout(() => {
                number.style.animation = 'numberPulse 0.5s ease';
            }, 10);
        });
    });
    
    // 开奖按钮点击波纹效果
    const drawBtn = document.querySelector('.btn-draw');
    if (drawBtn) {
        drawBtn.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }
    
    // 奖金表格行悬停效果
    const prizeRows = document.querySelectorAll('.prize-table tbody tr');
    prizeRows.forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.background = 'linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))';
        });
        
        row.addEventListener('mouseleave', function() {
            this.style.background = '';
        });
    });
}

// 状态提示管理
class StatusIndicator {
    constructor() {
        this.createIndicator();
    }
    
    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'status-indicator';
        indicator.id = 'statusIndicator';
        document.body.appendChild(indicator);
    }
    
    show(message, type = 'info', duration = 3000) {
        const indicator = document.getElementById('statusIndicator');
        if (indicator) {
            indicator.textContent = message;
            indicator.className = `status-indicator ${type} show`;
            
            setTimeout(() => {
                indicator.classList.remove('show');
            }, duration);
        }
    }
}

// 进度指示器
class ProgressIndicator {
    constructor() {
        this.createIndicator();
        this.progress = 0;
    }
    
    createIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'progress-indicator';
        indicator.id = 'progressIndicator';
        document.body.appendChild(indicator);
    }
    
    setProgress(percentage) {
        this.progress = Math.max(0, Math.min(100, percentage));
        const indicator = document.getElementById('progressIndicator');
        if (indicator) {
            indicator.style.width = `${this.progress}%`;
        }
    }
    
    increment(amount = 10) {
        this.setProgress(this.progress + amount);
    }
    
    complete() {
        this.setProgress(100);
        setTimeout(() => this.reset(), 1000);
    }
    
    reset() {
        this.setProgress(0);
    }
}

// 粒子背景效果
class ParticleBackground {
    constructor() {
        this.createContainer();
        this.particles = [];
        this.createParticles();
    }
    
    createContainer() {
        const container = document.createElement('div');
        container.className = 'particles';
        container.id = 'particleContainer';
        document.body.appendChild(container);
    }
    
    createParticles() {
        const container = document.getElementById('particleContainer');
        if (!container) return;
        
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 6 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            container.appendChild(particle);
            this.particles.push(particle);
        }
    }
}

// 浮动操作
// 浮动操作按钮
class FloatingActionButton {
    constructor() {
        this.createFAB();
        this.setupScrollListener();
        this.setupFABMenu();
    }
    
    createFAB() {
        const fab = document.createElement('div');
        fab.className = 'fab-container hidden';
        fab.innerHTML = `
            <div class="fab-main" id="fabMain">
                <span class="fab-icon">⬆️</span>
            </div>
            <div class="fab-menu" id="fabMenu">
                <div class="fab-item" data-action="random" title="快速机选">
                    <span class="fab-icon">🎲</span>
                    <span class="fab-label">机选</span>
                </div>
                <div class="fab-item" data-action="clear" title="清除选号">
                    <span class="fab-icon">🗑️</span>
                    <span class="fab-label">清除</span>
                </div>
                <div class="fab-item" data-action="bet" title="快速投注">
                    <span class="fab-icon">✅</span>
                    <span class="fab-label">投注</span>
                </div>
                <div class="fab-item" data-action="top" title="返回顶部">
                    <span class="fab-icon">⬆️</span>
                    <span class="fab-label">顶部</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(fab);
        this.addFABStyles();
        this.setupFABEvents();
    }
    
    setupScrollListener() {
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const fab = document.querySelector('.fab-container');
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 300) {
                fab.classList.remove('hidden');
            } else {
                fab.classList.add('hidden');
                this.closeFABMenu();
            }
            
            // 滚动方向检测
            if (scrollTop > lastScrollTop) {
                // 向下滚动
                fab.classList.add('scrolling-down');
            } else {
                // 向上滚动
                fab.classList.remove('scrolling-down');
            }
            lastScrollTop = scrollTop;
        });
    }
    
    setupFABMenu() {
        this.isMenuOpen = false;
    }
    
    setupFABEvents() {
        const fabMain = document.getElementById('fabMain');
        if (fabMain) {
            fabMain.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFABMenu();
            });
        }
        
        // 修复事件绑定
        const fabItems = document.querySelectorAll('.fab-item');
        fabItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = item.getAttribute('data-action');
                switch(action) {
                    case 'random':
                        this.quickRandomSelect();
                        break;
                    case 'clear':
                        this.quickClear();
                        break;
                    case 'bet':
                        this.quickBet();
                        break;
                    case 'top':
                        this.scrollToTop();
                        break;
                }
            });
        });
        
        // 点击其他地方关闭菜单
        document.addEventListener('click', () => {
            this.closeFABMenu();
        });
        
        // 阻止菜单点击事件冒泡
        const fabMenu = document.getElementById('fabMenu');
        if (fabMenu) {
            fabMenu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    
    toggleFABMenu() {
        const fabContainer = document.querySelector('.fab-container');
        const fabMenu = document.getElementById('fabMenu');
        
        if (this.isMenuOpen) {
            this.closeFABMenu();
        } else {
            this.openFABMenu();
        }
    }
    
    openFABMenu() {
        const fabContainer = document.querySelector('.fab-container');
        const fabMain = document.getElementById('fabMain');
        
        fabContainer.classList.add('menu-open');
        fabMain.style.transform = 'rotate(45deg)';
        this.isMenuOpen = true;
        
        // 播放打开音效
        this.playFABSound(800, 1000);
    }
    
    closeFABMenu() {
        const fabContainer = document.querySelector('.fab-container');
        const fabMain = document.getElementById('fabMain');
        
        if (fabContainer) {
            fabContainer.classList.remove('menu-open');
        }
        if (fabMain) {
            fabMain.style.transform = 'rotate(0deg)';
        }
        this.isMenuOpen = false;
    }
    
    scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        this.closeFABMenu();
        this.playFABSound(600, 800);
    }
    
    quickRandomSelect() {
        if (typeof randomSelect === 'function') {
            randomSelect();
        } else if (typeof enhancedRandomSelect === 'function') {
            enhancedRandomSelect();
        }
        this.closeFABMenu();
        if (statusIndicator) {
            statusIndicator.show('🎲 快速机选完成！', 'success', 2000);
        }
    }
    
    quickClear() {
        if (typeof clearSelection === 'function') {
            clearSelection();
        }
        this.closeFABMenu();
        if (statusIndicator) {
            statusIndicator.show('🗑️ 已清除选号！', 'info', 1500);
        }
    }
    
    quickBet() {
        if (typeof confirmTicket === 'function') {
            confirmTicket();
        }
        this.closeFABMenu();
    }
    
    playFABSound(startFreq, endFreq) {
        try {
            // 🔥 使用全局音频管理器，避免直接创建AudioContext
            if (typeof audioManager !== 'undefined' && audioManager.userInteracted) {
                audioManager.playSound(startFreq, 0.2, 0.1);
            }
        } catch (error) {
            // 静默处理音频错误
        }
    }
    
    addFABStyles() {
        if (document.getElementById('fabStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'fabStyles';
        style.textContent = `
            .fab-container {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 1000;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .fab-container.hidden {
                transform: scale(0) rotate(180deg);
                opacity: 0;
                pointer-events: none;
            }
            
            .fab-container.scrolling-down {
                transform: translateY(100px);
            }
            
            .fab-main {
                width: 60px;
                height: 60px;
                background: linear-gradient(45deg, #e74c3c, #c0392b);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5em;
                cursor: pointer;
                box-shadow: 0 8px 25px rgba(231, 76, 60, 0.4);
                transition: all 0.3s ease;
                position: relative;
                z-index: 1001;
            }
            
            .fab-main:hover {
                transform: scale(1.1);
                box-shadow: 0 12px 35px rgba(231, 76, 60, 0.6);
            }
            
            .fab-main:active {
                transform: scale(0.95);
            }
            
            .fab-menu {
                position: absolute;
                bottom: 70px;
                right: 0;
                display: flex;
                flex-direction: column;
                gap: 15px;
                opacity: 0;
                transform: scale(0.8) translateY(20px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                pointer-events: none;
            }
            
            .fab-container.menu-open .fab-menu {
                opacity: 1;
                transform: scale(1) translateY(0);
                pointer-events: all;
            }
            
            .fab-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                background: white;
                border-radius: 25px;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
                border: 2px solid transparent;
                min-width: 120px;
            }
            
            .fab-item:hover {
                transform: translateX(-5px) scale(1.05);
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                border-color: #3498db;
            }
            
            .fab-item:active {
                transform: translateX(-5px) scale(0.98);
            }
            
            .fab-icon {
                font-size: 1.2em;
                min-width: 20px;
                text-align: center;
            }
            
            .fab-label {
                font-weight: bold;
                color: #2c3e50;
                font-size: 0.9em;
            }
            
            .fab-item:nth-child(1) {
                animation-delay: 0.1s;
            }
            
            .fab-item:nth-child(2) {
                animation-delay: 0.2s;
            }
            
            .fab-item:nth-child(3) {
                animation-delay: 0.3s;
            }
            
            .fab-item:nth-child(4) {
                animation-delay: 0.4s;
            }
            
            .fab-container.menu-open .fab-item {
                animation: fabItemSlideIn 0.3s ease-out forwards;
            }
            
            @keyframes fabItemSlideIn {
                0% {
                    opacity: 0;
                    transform: translateX(50px) scale(0.8);
                }
                100% {
                    opacity: 1;
                    transform: translateX(0) scale(1);
                }
            }
            
            /* 响应式设计 */
            @media (max-width: 768px) {
                .fab-container {
                    bottom: 20px;
                    right: 20px;
                }
                
                .fab-main {
                    width: 50px;
                    height: 50px;
                    font-size: 1.2em;
                }
                
                .fab-item {
                    padding: 10px 14px;
                    min-width: 100px;
                }
                
                .fab-icon {
                    font-size: 1em;
                }
                
                .fab-label {
                    font-size: 0.8em;
                }
            }
            
            /* 深色模式支持 */
            @media (prefers-color-scheme: dark) {
                .fab-item {
                    background: #2c3e50;
                    color: white;
                }
                
                .fab-label {
                    color: #ecf0f1;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// 动画管理器增强
class AnimationManager {
    static animateElement(element, animationName, duration = '0.5s') {
        return new Promise(resolve => {
            element.style.animation = `${animationName} ${duration} ease-out`;
            
            const handleAnimationEnd = () => {
                element.style.animation = '';
                element.removeEventListener('animationend', handleAnimationEnd);
                resolve();
            };
            
            element.addEventListener('animationend', handleAnimationEnd);
        });
    }
    
    static shake(element) {
        return this.animateElement(element, 'shake', '0.5s');
    }
    
    static bounce(element) {
        return this.animateElement(element, 'bounceIn', '0.6s');
    }
    
    static slideIn(element, direction = 'up') {
        const animationName = `slideIn${direction.charAt(0).toUpperCase() + direction.slice(1)}`;
        return this.animateElement(element, animationName, '0.5s');
    }
    
    static zoomIn(element) {
        return this.animateElement(element, 'zoomIn', '0.3s');
    }
    
    static pulse(element) {
        return this.animateElement(element, 'pulse', '1s');
    }
    
    static fadeIn(element) {
        return this.animateElement(element, 'fadeIn', '0.5s');
    }
    
    static flipIn(element) {
        return this.animateElement(element, 'flipInY', '0.6s');
    }
    
    static rubberBand(element) {
        return this.animateElement(element, 'rubberBand', '1s');
    }
}

// 交互增强管理器
class InteractionEnhancer {
    constructor() {
        this.lastHoverTime = 0;
        this.hoverCooldown = 50; // 50ms防抖间隔
        this.setupHoverEffects();
        this.setupClickEffects();
        this.setupKeyboardShortcuts();
        this.setupGestureSupport();
    }
    
    setupHoverEffects() {
        // 为所有球添加悬浮音效和视觉反馈
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('ball')) {
                this.playHoverSound(e.target);
                e.target.style.transform = 'scale(1.1)';
                e.target.style.transition = 'all 0.2s ease';
                
                // 添加微妙的发光效果
                if (e.target.classList.contains('red-ball')) {
                    e.target.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.6)';
                } else if (e.target.classList.contains('blue-ball')) {
                    e.target.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.6)';
                } else if (e.target.classList.contains('front-ball')) {
                    e.target.style.boxShadow = '0 0 15px rgba(231, 76, 60, 0.6)'; // 大乐透前区球现在是红色
                } else if (e.target.classList.contains('back-ball')) {
                    e.target.style.boxShadow = '0 0 15px rgba(52, 152, 219, 0.6)'; // 大乐透后区球现在是蓝色
                }
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('ball')) {
                e.target.style.transform = '';
                e.target.style.boxShadow = '';
            }
        });
    }
    
    setupClickEffects() {
        // 为所有按钮和球添加点击波纹效果
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn') || 
                e.target.classList.contains('ball') ||
                e.target.classList.contains('fab-item')) {
                this.createRipple(e);
            }
        });
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 快捷键支持
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchToTab('selection');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchToTab('draw');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchToTab('check');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchToTab('account');
                        break;
                    case 'r':
                        e.preventDefault();
                        randomSelect();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        confirmTicket();
                        break;
                    case 'Backspace':
                        e.preventDefault();
                        clearSelection();
                        break;
                }
            }
            
            // ESC键关闭模态框
            if (e.key === 'Escape') {
                closeModal();
                const fabContainer = document.querySelector('.fab-container');
                if (fabContainer && fabContainer.classList.contains('menu-open')) {
                    const fab = new FloatingActionButton();
                    fab.closeFABMenu();
                }
            }
        });
    }
    
    setupGestureSupport() {
        // 触摸手势支持
        let startY = 0;
        let startTime = 0;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
        });
        
        document.addEventListener('touchend', (e) => {
            const endY = e.changedTouches[0].clientY;
            const endTime = Date.now();
            const deltaY = startY - endY;
            const deltaTime = endTime - startTime;
            
            // 快速向上滑动返回顶部
            if (deltaY > 100 && deltaTime < 300) {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    }
    
    createRipple(e) {
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
            z-index: 1;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    switchToTab(tabName) {
        const tabButton = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
        if (tabButton) {
            tabButton.click();
            statusIndicator.show(`切换到${tabButton.textContent}`, 'info', 1000);
        }
    }
    
    playHoverSound(ballElement) {
        // 🔊 启用球体悬停音效（带防抖）
        const now = Date.now();
        if (now - this.lastHoverTime < this.hoverCooldown) {
            return; // 防抖：如果距离上次播放音效不足50ms，则跳过
        }
        this.lastHoverTime = now;
        
        try {
            if (typeof audioManager !== 'undefined' && audioManager.userInteracted) {
                let frequency = 600; // 默认频率
                
                // 根据球类型设置不同的音效频率
                if (ballElement && ballElement.classList) {
                    if (ballElement.classList.contains('red-ball')) {
                        frequency = 650 + Math.random() * 100; // 双色球红球：650-750Hz，温暖音调
                    } else if (ballElement.classList.contains('blue-ball')) {
                        frequency = 750 + Math.random() * 100; // 双色球蓝球：750-850Hz，清脆音调
                    } else if (ballElement.classList.contains('front-ball')) {
                        frequency = 650 + Math.random() * 100; // 大乐透前区球(红色)：650-750Hz，与红球同音调
                    } else if (ballElement.classList.contains('back-ball')) {
                        frequency = 750 + Math.random() * 100; // 大乐透后区球(蓝色)：750-850Hz，与蓝球同音调
                    } else {
                        frequency = 700 + Math.random() * 100; // 其他球：700-800Hz，中性音调
                    }
                }
                
                audioManager.playSound(frequency, 0.08, 0.04); // 音量0.08，持续0.04秒
            }
        } catch (error) {
            // 静默处理音频错误
        }
    }
}

// 性能监控增强
class PerformanceMonitor {
    constructor() {
        this.startTime = performance.now();
        this.setupMonitoring();
        this.setupErrorHandling();
    }
    
    setupMonitoring() {
        // 监控页面加载性能
        window.addEventListener('load', () => {
            const loadTime = performance.now() - this.startTime;

            
            if (loadTime > 3000) {
                statusIndicator.show('页面加载较慢，建议检查网络连接', 'warning', 5000);
            }
            
            // 记录性能指标
            this.recordPerformanceMetrics();
        });
        
        // 监控内存使用
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB

                }
            }, 30000);
        }
        
        // 🔥 优化：使用requestIdleCallback减少性能影响
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.initPerformanceObserver();
            });
        } else {
            setTimeout(() => {
                this.initPerformanceObserver();
            }, 1000);
        }
    }
    
    initPerformanceObserver() {
        // 监控长任务
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        // 🔥 减少控制台输出频率
                        if (Math.random() < 0.1) { // 只输出10%的长任务警告

                        }
                        
                        // 🔥 自动优化建议
                        if (entry.duration > 100) {
                            this.suggestOptimization(entry);
                        }
                    }
                }
            });
            
            try {
                observer.observe({ entryTypes: ['longtask'] });
            } catch (error) {

            }
        }
    }
    
    // 🔥 优化：性能优化建议（减少频率）
    suggestOptimization(entry) {
        // 减少建议输出频率，避免控制台刷屏
        if (Math.random() > 0.05) return; // 只有5%概率输出建议
        
        const suggestions = [
            '考虑使用requestAnimationFrame分解长任务',
            '检查是否有同步的DOM操作可以异步化',
            '考虑使用Web Workers处理计算密集型任务',
            '检查是否有不必要的循环或递归',
            '使用DocumentFragment批量操作DOM',
            '考虑虚拟化长列表显示'
        ];
        
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];

    }
    
    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('error', (e) => {

            statusIndicator.show('系统出现错误，请刷新页面重试', 'error', 5000);
        });
        
        // Promise错误处理
        window.addEventListener('unhandledrejection', (e) => {

            e.preventDefault();
        });
    }
    
    recordPerformanceMetrics() {
        if ('getEntriesByType' in performance) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                const metrics = {
                    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcp: navigation.connectEnd - navigation.connectStart,
                    request: navigation.responseStart - navigation.requestStart,
                    response: navigation.responseEnd - navigation.responseStart,
                    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    load: navigation.loadEventEnd - navigation.loadEventStart
                };
                

            }
        }
    }
    
    measureFunction(fn, name) {
        return function(...args) {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();

            return result;
        };
    }
}

// 辅助工具函数
function showSelectionLimitAlert(ballType) {
    const limits = {
        red: '红球最多选择6个',
        blue: '蓝球只能选择1个',
        front: '前区最多选择5个',
        back: '后区最多选择2个'
    };
    
    statusIndicator.show(limits[ballType], 'warning', 2000);
}

function showQuantityAlert(message) {
    statusIndicator.show(message, 'warning', 2000);
}

function playBallSelectSound() {
    playSelectSound();
}

function playBallDeselectSound() {
    playDeselectSound();
}

// 增强的机选功能 - 带跑马灯效果
function enhancedRandomSelect() {
    const randomBtn = document.querySelector('.btn-random');
    if (randomBtn) {
        randomBtn.disabled = true;
        randomBtn.textContent = '🎰 机选中...';
    }
    
    // 添加机选特效样式
    addRandomSelectStyles();
    
    playRandomSelectSound();
    
    if (currentLotteryType === 'doubleColor') {
        enhancedAnimatedRandomSelectDoubleColor();
    } else {
        enhancedAnimatedRandomSelectDaletou();
    }
}

// 增强双色球跑马灯机选
function enhancedAnimatedRandomSelectDoubleColor() {
    clearSelection();
    
    // 红球跑马灯效果
    let redBallIndex = 0;
    const redBalls = document.querySelectorAll('.red-ball');
    
    // 添加全局闪烁效果
    const redGrid = document.querySelector('.red-ball-grid');
    if (redGrid) redGrid.classList.add('random-selecting');
    
    const redInterval = setInterval(() => {
        // 清除之前的高亮
        redBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮多个球，创建更强烈的视觉效果
        for (let i = 0; i < 12; i++) {
            const randomBall = redBalls[Math.floor(Math.random() * redBalls.length)];
            if (i < 3) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        // 播放跑马灯音效
        if (redBallIndex % 3 === 0) {
            playRandomTickSound();
        }
        
        redBallIndex++;
        
        if (redBallIndex > 30) {
            clearInterval(redInterval);
            if (redGrid) redGrid.classList.remove('random-selecting');
            
            // 确定最终红球
            const finalRedNumbers = generateRandomNumbers(33, 6);
            finalRedNumbers.forEach((num, index) => {
                setTimeout(() => {
                    // 清除所有高亮
                    redBalls.forEach(ball => {
                        ball.classList.remove('highlight', 'super-highlight');
                    });
                    
                    const ball = document.querySelector(`[data-number="${num}"].red-ball`);
                    if (ball) {
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.doubleColor.red.push(num);
                        playBallConfirmSound();
                        
                        // 添加确定动画
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalRedNumbers.length - 1) {
                            selectedNumbers.doubleColor.red.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            
                            // 开始蓝球选择
                            setTimeout(() => {
                                enhancedAnimatedSelectBlueBall();
                            }, 500);
                        }
                    }
                }, index * 400);
            });
        }
    }, 80); // 更快的切换速度
}

// 增强蓝球动画选择
function enhancedAnimatedSelectBlueBall() {
    let blueBallIndex = 0;
    const blueBalls = document.querySelectorAll('.blue-ball');
    
    // 添加蓝球区域特效
    const blueGrid = document.querySelector('.blue-ball-grid');
    if (blueGrid) blueGrid.classList.add('random-selecting');
    
    const blueInterval = setInterval(() => {
        // 清除之前的高亮
        blueBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮球，创建追逐效果
        for (let i = 0; i < 6; i++) {
            const randomBall = blueBalls[Math.floor(Math.random() * blueBalls.length)];
            if (i < 2) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        // 播放跑马灯音效
        if (blueBallIndex % 2 === 0) {
            playRandomTickSound();
        }
        
        blueBallIndex++;
        
        if (blueBallIndex > 20) {
            clearInterval(blueInterval);
            if (blueGrid) blueGrid.classList.remove('random-selecting');
            
            // 确定最终蓝球
            const finalBlueNumber = Math.floor(Math.random() * 16) + 1;
            const ball = document.querySelector(`[data-number="${finalBlueNumber}"].blue-ball`);
            if (ball) {
                // 清除所有高亮
                blueBalls.forEach(b => {
                    b.classList.remove('highlight', 'super-highlight');
                });
                
                ball.classList.add('selected', 'final-selected');
                selectedNumbers.doubleColor.blue = [finalBlueNumber];
                updateSelectedDisplay();
                playBallConfirmSound();
                
                // 添加确定动画
                ball.style.animation = 'ballConfirm 0.6s ease-out';
                
                // 完成机选
                finishEnhancedRandomSelect();
            }
        }
    }, 120); // 稍慢的蓝球速度
}

// 增强大乐透跑马灯机选
function enhancedAnimatedRandomSelectDaletou() {
    clearSelection();
    
    // 前区跑马灯效果
    let frontBallIndex = 0;
    const frontBalls = document.querySelectorAll('.front-ball');
    
    const frontGrid = document.querySelector('.front-ball-grid');
    if (frontGrid) frontGrid.classList.add('random-selecting');
    
    const frontInterval = setInterval(() => {
        // 清除之前的高亮
        frontBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮几个球
        for (let i = 0; i < 10; i++) {
            const randomBall = frontBalls[Math.floor(Math.random() * frontBalls.length)];
            if (i < 3) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        if (frontBallIndex % 3 === 0) {
            playRandomTickSound();
        }
        
        frontBallIndex++;
        
        if (frontBallIndex > 25) {
            clearInterval(frontInterval);
            if (frontGrid) frontGrid.classList.remove('random-selecting');
            
            // 确定最终前区号码
            const finalFrontNumbers = generateRandomNumbers(35, 5);
            finalFrontNumbers.forEach((num, index) => {
                setTimeout(() => {
                    const ball = document.querySelector(`[data-number="${num}"].front-ball`);
                    if (ball) {
                        frontBalls.forEach(b => b.classList.remove('highlight', 'super-highlight'));
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.daletou.front.push(num);
                        playBallConfirmSound();
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalFrontNumbers.length - 1) {
                            selectedNumbers.daletou.front.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            
                            // 开始后区选择
                            setTimeout(() => {
                                enhancedAnimatedSelectBackBalls();
                            }, 500);
                        }
                    }
                }, index * 300);
            });
        }
    }, 80);
}

// 增强后区动画选择
function enhancedAnimatedSelectBackBalls() {
    let backBallIndex = 0;
    const backBalls = document.querySelectorAll('.back-ball');
    
    const backGrid = document.querySelector('.back-ball-grid');
    if (backGrid) backGrid.classList.add('random-selecting');
    
    const backInterval = setInterval(() => {
        // 清除之前的高亮
        backBalls.forEach(ball => {
            ball.classList.remove('highlight', 'super-highlight');
        });
        
        // 随机高亮几个球
        for (let i = 0; i < 4; i++) {
            const randomBall = backBalls[Math.floor(Math.random() * backBalls.length)];
            if (i < 2) {
                randomBall.classList.add('super-highlight');
            } else {
                randomBall.classList.add('highlight');
            }
        }
        
        if (backBallIndex % 2 === 0) {
            playRandomTickSound();
        }
        
        backBallIndex++;
        
        if (backBallIndex > 20) {
            clearInterval(backInterval);
            if (backGrid) backGrid.classList.remove('random-selecting');
            
            // 确定最终后区号码
            const finalBackNumbers = generateRandomNumbers(12, 2);
            finalBackNumbers.forEach((num, index) => {
                setTimeout(() => {
                    const ball = document.querySelector(`[data-number="${num}"].back-ball`);
                    if (ball) {
                        backBalls.forEach(b => b.classList.remove('highlight', 'super-highlight'));
                        ball.classList.add('selected', 'final-selected');
                        selectedNumbers.daletou.back.push(num);
                        playBallConfirmSound();
                        ball.style.animation = 'ballConfirm 0.6s ease-out';
                        
                        if (index === finalBackNumbers.length - 1) {
                            selectedNumbers.daletou.back.sort((a, b) => a - b);
                            updateSelectedDisplay();
                            
                            // 完成机选
                            finishEnhancedRandomSelect();
                        }
                    }
                }, index * 400);
            });
        }
    }, 120);
}

// 完成增强机选
function finishEnhancedRandomSelect() {
    // 恢复按钮状态
    const randomBtn = document.querySelector('.btn-random');
    if (randomBtn) {
        randomBtn.disabled = false;
        randomBtn.textContent = '🎲 机选';
    }
    
    // 清除所有高亮
    document.querySelectorAll('.ball').forEach(ball => {
        ball.classList.remove('highlight', 'super-highlight', 'final-selected');
        ball.style.animation = '';
    });
    
    // 播放完成音效
    playRandomCompleteSound();
    
    // 显示完成提示
    statusIndicator.show('🎉 机选完成！', 'success', 2000);
}

// 添加机选特效样式
function addRandomSelectStyles() {
    if (document.getElementById('randomSelectStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'randomSelectStyles';
    style.textContent = `
        .random-selecting {
            animation: gridPulse 0.5s ease-in-out infinite;
        }
        
        .ball.highlight {
            background: linear-gradient(45deg, #f39c12, #e67e22) !important;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(243, 156, 18, 0.8);
            animation: ballFlash 0.3s ease-in-out;
        }
        
        .ball.super-highlight {
            background: linear-gradient(45deg, #e74c3c, #c0392b) !important;
            transform: scale(1.2);
            box-shadow: 0 0 25px rgba(231, 76, 60, 1);
            animation: ballSuperFlash 0.3s ease-in-out;
            z-index: 10;
        }
        
        .ball.final-selected {
            animation: ballConfirm 0.6s ease-out;
        }
        
        @keyframes gridPulse {
            0%, 100% {
                box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
            }
            50% {
                box-shadow: 0 0 20px rgba(52, 152, 219, 0.6);
            }
        }
        
        @keyframes ballFlash {
            0%, 100% {
                transform: scale(1.1);
                opacity: 1;
            }
            50% {
                transform: scale(1.15);
                opacity: 0.8;
            }
        }
        
        @keyframes ballSuperFlash {
            0%, 100% {
                transform: scale(1.2);
                opacity: 1;
            }
            25% {
                transform: scale(1.3);
                opacity: 0.9;
            }
            75% {
                transform: scale(1.25);
                opacity: 0.95;
            }
        }
        
        @keyframes ballConfirm {
            0% {
                transform: scale(1);
            }
            25% {
                transform: scale(1.4) rotate(10deg);
            }
            50% {
                transform: scale(1.2) rotate(-5deg);
            }
            75% {
                transform: scale(1.3) rotate(3deg);
            }
            100% {
                transform: scale(1.1) rotate(0deg);
            }
        }
    `;
    document.head.appendChild(style);
}

// 新增跑马灯音效
function playRandomTickSound() {
    try {
        // 🔥 使用全局音频管理器，避免直接创建AudioContext
        if (typeof audioManager !== 'undefined' && audioManager.userInteracted) {
            const frequency = 800 + Math.random() * 400;
            audioManager.playSound(frequency, 0.1, 0.05);
        }
    } catch (error) {
        // 静默处理音频错误
    }
}

// 居中弹窗系统
function showCenterModal(title, message, type = 'info') {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content ${type}">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <p>${message}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeCenterModal()">确定</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCenterModalStyles();
}

// 投注确认弹窗
function showBetConfirmationModal(ticketData) {
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content confirmation">
            <div class="modal-header">
                <h3>📋 确认投注</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="confirmation-details">
                    <div class="detail-row">
                        <span class="label">彩票类型：</span>
                        <span class="value">${ticketData.type === 'doubleColor' ? '🔴 双色球' : '🔵 大乐透'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">选择号码：</span>
                        <div class="value numbers-display">
                            ${formatTicketNumbersForConfirm(ticketData)}
                        </div>
                    </div>
                    <div class="detail-row">
                        <span class="label">投注数量：</span>
                        <span class="value highlight">${ticketData.quantity} 注</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">单注金额：</span>
                        <span class="value">¥${ticketPrice}</span>
                    </div>
                    <div class="detail-row total">
                        <span class="label">总金额：</span>
                        <span class="value total-amount">¥${ticketData.totalCost}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">当前余额：</span>
                        <span class="value">¥${accountBalance}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">投注后余额：</span>
                        <span class="value">¥${accountBalance - ticketData.totalCost}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="processBet(${JSON.stringify(ticketData).replace(/"/g, '&quot;')}); closeCenterModal()">✅ 确认投注</button>
                <button class="btn btn-secondary" onclick="closeCenterModal()">❌ 取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCenterModalStyles();
}

// 关闭居中弹窗
function closeCenterModal() {
    const modals = document.querySelectorAll('.center-modal');
    modals.forEach(modal => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => modal.remove(), 300);
    });
}

// 添加居中弹窗样式
function addCenterModalStyles() {
    if (document.getElementById('centerModalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'centerModalStyles';
    style.textContent = `
        .center-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modalFadeIn 0.3s ease-out;
        }
        
        .center-modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }
        
        .center-modal-content {
            position: relative;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: modalSlideIn 0.3s ease-out;
        }
        
        .center-modal-content.warning {
            border-top: 5px solid #f39c12;
        }
        
        .center-modal-content.error {
            border-top: 5px solid #e74c3c;
        }
        
        .center-modal-content.confirmation {
            border-top: 5px solid #3498db;
        }
        
        .modal-header {
            padding: 20px 25px 15px;
            border-bottom: 1px solid #e9ecef;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.3em;
        }
        
        .close-btn {
            background: none;
            border: none;
            font-size: 1.5em;
            color: #7f8c8d;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .close-btn:hover {
            background: #e9ecef;
            color: #2c3e50;
        }
        
        .modal-body {
            padding: 20px 25px;
        }
        
        .modal-body p {
            margin: 0;
            color: #2c3e50;
            line-height: 1.6;
            text-align: center;
        }
        
        .confirmation-details {
            text-align: left;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #f8f9fa;
        }
        
        .detail-row:last-child {
            border-bottom: none;
        }
        
        .detail-row.total {
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            margin: 10px -10px;
            padding: 15px 10px;
            border-radius: 8px;
            font-weight: bold;
        }
        
        .detail-row .label {
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .detail-row .value {
            color: #2c3e50;
            font-weight: 600;
        }
        
        .detail-row .value.highlight {
            color: #e74c3c;
            font-size: 1.1em;
        }
        
        .detail-row .value.total-amount {
            color: #f39c12;
            font-size: 1.2em;
        }
        
        .numbers-display {
            display: flex;
            align-items: center;
            gap: 5px;
            flex-wrap: wrap;
        }
        
        .confirm-ball {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 0.8em;
        }
        
        .modal-footer {
            padding: 15px 25px 20px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .modal-footer .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-footer .btn-primary {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
        }
        
        .modal-footer .btn-primary:hover {
            background: linear-gradient(45deg, #229954, #27ae60);
            transform: translateY(-2px);
        }
        
        .modal-footer .btn-secondary {
            background: linear-gradient(45deg, #95a5a6, #bdc3c7);
            color: white;
        }
        
        .modal-footer .btn-secondary:hover {
            background: linear-gradient(45deg, #7f8c8d, #95a5a6);
            transform: translateY(-2px);
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// 修改原有的confirmTicket函数以使用新的弹窗
function confirmTicket() {
    let isValid = false;
    let ticketData = {};
    
    if (currentLotteryType === 'doubleColor') {
        isValid = selectedNumbers.doubleColor.red.length === 6 && selectedNumbers.doubleColor.blue.length === 1;
        if (isValid) {
            ticketData = {
                type: 'doubleColor',
                lotteryType: 'doubleColor',
                numbers: [...selectedNumbers.doubleColor.red],
                red: [...selectedNumbers.doubleColor.red],
                blueNumber: selectedNumbers.doubleColor.blue[0],
                blue: selectedNumbers.doubleColor.blue[0],
                quantity: betQuantity,
                totalCost: betQuantity * ticketPrice
            };
        }
    } else {
        isValid = selectedNumbers.daletou.front.length === 5 && selectedNumbers.daletou.back.length === 2;
        if (isValid) {
            ticketData = {
                type: 'daletou',
                lotteryType: 'daletou',
                frontNumbers: [...selectedNumbers.daletou.front],
                front: [...selectedNumbers.daletou.front],
                backNumbers: [...selectedNumbers.daletou.back],
                back: [...selectedNumbers.daletou.back],
                quantity: betQuantity,
                totalCost: betQuantity * ticketPrice
            };
        }
    }
    
    if (!isValid) {
        showCenterModal('⚠️ 选号提醒', '请先完成选号！', 'warning');
        return;
    }
    
    // 检查余额
    if (accountBalance < ticketData.totalCost) {
        showCenterModal('💰 余额不足', `需要¥${ticketData.totalCost}，当前余额¥${accountBalance}`, 'error');
        return;
    }
    
    // 显示投注确认弹窗
    showBetConfirmationModal(ticketData);
}

// 安全的函数调用包装器
function safeCall(fn, context = null, ...args) {
    try {
        if (typeof fn === 'function') {
            return fn.apply(context, args);
        } else {

            return null;
        }
    } catch (error) {

        if (typeof statusIndicator !== 'undefined' && statusIndicator && statusIndicator.show) {
            statusIndicator.show('操作失败，请重试', 'error', 2000);
        }
        return null;
    }
}

// 安全的DOM元素获取
function safeGetElement(id) {
    try {
        const element = document.getElementById(id);
        if (!element) {
            // 🔥 尝试常见的ID变体
            const alternatives = {
                'drawCountdown': ['countdown', 'draw-countdown', 'drawTimer'],
                'countdown': ['drawCountdown', 'timer', 'countdownTimer']
            };
            
            if (alternatives[id]) {
                for (const altId of alternatives[id]) {
                    const altElement = document.getElementById(altId);
                    if (altElement) {

                        return altElement;
                    }
                }
            }
            
            // 🔥 减少错误输出频率
            if (!safeGetElement._errorCache) {
                safeGetElement._errorCache = new Set();
            }
            
            if (!safeGetElement._errorCache.has(id)) {

                safeGetElement._errorCache.add(id);
                
                // 5秒后清除缓存，允许重新报错
                setTimeout(() => {
                    safeGetElement._errorCache.delete(id);
                }, 5000);
            }
            
            return null;
        }
        return element;
    } catch (error) {

        return null;
    }
}

// 🔥 新增：按钮稳定性保护函数
function protectDrawButton() {
    try {
        const drawAction = document.querySelector('.draw-action');
        const btnDraw = document.querySelector('.btn-draw');
        
        if (drawAction) {
            // 强制重置所有可能导致闪动的属性
            drawAction.style.animation = 'none';
            drawAction.style.transform = 'none';
            drawAction.style.transition = 'none';
            drawAction.style.willChange = 'auto';
            drawAction.style.contain = 'layout style paint';
            drawAction.style.isolation = 'isolate';
            drawAction.style.position = 'relative';
            drawAction.style.zIndex = '100';
        }
        
        if (btnDraw) {
            // 强制重置按钮状态
            btnDraw.style.animation = 'none';
            btnDraw.style.transform = 'none';
            btnDraw.style.willChange = 'auto';
            btnDraw.style.contain = 'layout style paint';
            btnDraw.style.isolation = 'isolate';
            btnDraw.style.position = 'relative';
            
            // 清除原有的事件监听器并重新绑定稳定的hover事件
            const newBtn = btnDraw.cloneNode(true);
            btnDraw.parentNode.replaceChild(newBtn, btnDraw);
            
            newBtn.addEventListener('mouseenter', function() {
                this.style.background = 'linear-gradient(135deg, #c0392b, #a93226)';
                this.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.5)';
                this.style.transform = 'none'; // 确保不移动
            });
            
            newBtn.addEventListener('mouseleave', function() {
                this.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
                this.style.boxShadow = '0 8px 25px rgba(231, 76, 60, 0.4)';
                this.style.transform = 'none'; // 确保不移动
            });
            
            // 重新绑定点击事件
            newBtn.addEventListener('click', function() {
                if (typeof startDraw === 'function') {
                    startDraw();
                }
            });
        }
        

    } catch (error) {

    }
}

// 🔥 修复：增强版安全初始化函数
function initializeSystemSafely() {
    console.log('🚀 开始系统安全初始化...');
    
    // 确保所有必要的DOM元素存在
    const requiredElements = [
        'redBallGrid', 'blueBallGrid', 'frontBallGrid', 'backBallGrid',
        'selectedRedBalls', 'selectedBlueBalls', 'selectedFrontBalls', 'selectedBackBalls',
        'betQuantity', 'totalCost'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {

    }
    
    // 🔥 检查必要的函数是否存在（支持全局和window作用域）
    const requiredFunctions = [
        'initializeBalls', 'updatePrizeTable', 'updateStatsDisplay', 
        'updateAccountDisplay', 'updateTicketsList', 'updateDrawHistory', 'startCountdown'
    ];
    
    const missingFunctions = requiredFunctions.filter(funcName => {
        try {
            return typeof eval(funcName) !== 'function' && typeof window[funcName] !== 'function';
        } catch (e) {
            return typeof window[funcName] !== 'function';
        }
    });
    
    if (missingFunctions.length > 0) {

    }
    
    // 安全初始化
    try {
        
        
        // 球体初始化
        if (typeof initializeBalls === 'function') {
        safeCall(initializeBalls);
        
        }
        
        // 奖金表更新
        if (typeof updatePrizeTable === 'function') {
        safeCall(updatePrizeTable);
        
        }
        
        // 统计信息更新
        if (typeof updateStatsDisplay === 'function') {
        safeCall(updateStatsDisplay);
        
        }
        
        // 账户显示更新
        if (typeof updateAccountDisplay === 'function') {
        safeCall(updateAccountDisplay);
        
        }
        
        // 投注单列表更新
        if (typeof updateTicketsList === 'function') {
        safeCall(updateTicketsList);
        
        }
        
        // 开奖历史更新（延迟到用户访问历史页面时）

        
        // 倒计时启动
        if (typeof startCountdown === 'function') {
        safeCall(startCountdown);
        
        }
        
        console.log('🎉 系统初始化完全成功！');
        return true;
        
    } catch (error) {
        console.error('❌ 系统初始化失败:', error);
        return false;
    }
}

// 添加摇晃动画的CSS
function addShakeAnimation() {
    if (document.getElementById('shakeAnimation')) return;
    
    const style = document.createElement('style');
    style.id = 'shakeAnimation';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .quantity-updated {
            animation: quantityUpdate 0.3s ease-out;
            border-color: #3498db !important;
        }
        
        .cost-updated {
            animation: costUpdate 0.4s ease-out;
            color: #e74c3c !important;
        }
        
        @keyframes quantityUpdate {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes costUpdate {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
        }
        
        .quantity-add-animation {
            animation: quantityAddAnimation 0.6s ease-out;
            border-color: #27ae60 !important;
            box-shadow: 0 0 10px rgba(39, 174, 96, 0.5);
        }
        
        @keyframes quantityAddAnimation {
            0% { transform: scale(1); }
            25% { transform: scale(1.15); }
            50% { transform: scale(1.05); }
            75% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes quantityFeedback {
            0% {
                opacity: 0;
                transform: translateY(10px) scale(0.8);
            }
            20% {
                opacity: 1;
                transform: translateY(-5px) scale(1.1);
            }
            80% {
                opacity: 1;
                transform: translateY(-15px) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(-25px) scale(0.9);
            }
        }
    `;
    document.head.appendChild(style);
}

// 页面初始化完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面DOM加载完成');
    
    // 添加摇晃动画
    addShakeAnimation();
    
    // 初始化自定义数量输入验证
    setupCustomQuantityValidation();
    
    // 加载保存的数据
    safeCall(loadData);
    
    // 创建页面加载器
    try {
        new PageLoader();
    } catch (error) {

    }
    
    // 增强开奖大厅交互效果
    enhanceDrawHallInteractions();
    
    // 延迟初始化其他组件
    setTimeout(() => {
        try {
            // 初始化UI组件
            if (typeof StatusIndicator === 'function') {
                statusIndicator = new StatusIndicator();
            }
            
            if (typeof ProgressIndicator === 'function') {
                progressIndicator = new ProgressIndicator();
            }
            
            if (typeof ParticleBackground === 'function') {
                new ParticleBackground();
            }
            
            if (typeof FloatingActionButton === 'function') {
                new FloatingActionButton();
            }
            
            if (typeof InteractionEnhancer === 'function') {
                new InteractionEnhancer();
            }
            
            if (typeof PerformanceMonitor === 'function') {
                new PerformanceMonitor();
            }
            
            // 初始化彩票系统
            if (initializeSystemSafely()) {
                console.log('彩票系统初始化成功');
                
                // 添加额外样式
                safeCall(addAdditionalStyles);
                
                // 🔥 启用按钮稳定性保护
                setTimeout(() => {
                    safeCall(protectDrawButton);
                }, 1000);
                
                // 显示欢迎消息
                setTimeout(() => {
                    if (statusIndicator) {
                        statusIndicator.show('🎉 彩票系统加载完成！', 'success', 3000);
                    }
                }, 1000);
                
                // 🔥 定期检查按钮稳定性（每15秒）
                setInterval(() => {
                    safeCall(protectDrawButton);
                }, 15000);
            } else {
                console.error('彩票系统初始化失败');
                if (statusIndicator) {
                    statusIndicator.show('系统初始化失败，请刷新页面', 'error', 5000);
                }
            }
            
        } catch (error) {

            alert('系统加载失败，请刷新页面重试');
        }
    }, 2500);
});

// 页面卸载时保存数据
window.addEventListener('beforeunload', () => {
    saveData();
});

// 导出主要函数供全局使用
window.lotterySystem = {
    randomSelect: enhancedRandomSelect,
    clearSelection,
    confirmTicket,
    showTab,
    switchLotteryType,
    adjustQuantity,
    setQuantity,
    startDraw,
    checkAllTickets,
    claimAllWinnings
};

// 一键兑奖所有奖品（修复HTML中调用的函数）
function claimAllPrizes() {
    claimAllWinnings();
}

// 开奖倒计时功能
function startCountdown() {
    function updateCountdown() {
        try {
            const now = new Date();
            const nextDraw = getNextDrawTime();
            const diff = nextDraw - now;
            
            const countdownElement = safeGetElement('drawCountdown');
            if (!countdownElement) return;
            
            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                
                countdownElement.innerHTML = `
                    <div class="countdown-display">
                        <div class="countdown-item">
                            <span class="countdown-number">${days}</span>
                            <span class="countdown-label">天</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-number">${hours}</span>
                            <span class="countdown-label">时</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-number">${minutes}</span>
                            <span class="countdown-label">分</span>
                        </div>
                        <div class="countdown-item">
                            <span class="countdown-number">${seconds}</span>
                            <span class="countdown-label">秒</span>
                        </div>
                    </div>
                    <div class="next-draw-info">下次开奖时间：${nextDraw.toLocaleString()}</div>
                `;
                
                // 🔥 修复：最后10秒时添加紧急提示（严格限制在倒计时区域）
                if (diff <= 10000) {
                    // 只对倒计时显示区域添加紧急状态
                    const countdownDisplay = countdownElement.querySelector('.countdown-display');
                    if (countdownDisplay) {
                        countdownDisplay.classList.add('countdown-urgent');
                    }
                    countdownElement.style.color = '#e74c3c';
                    
                    // 🔥 确保按钮区域不受影响
                    const drawAction = document.querySelector('.draw-action');
                    if (drawAction) {
                        drawAction.style.animation = 'none';
                        drawAction.style.transform = 'none';
                    }
                } else {
                    // 移除紧急状态
                    const countdownDisplay = countdownElement.querySelector('.countdown-display');
                    if (countdownDisplay) {
                        countdownDisplay.classList.remove('countdown-urgent');
                    }
                    countdownElement.classList.remove('countdown-urgent');
                    countdownElement.style.color = '';
                }
            } else {
                countdownElement.innerHTML = `
                    <div class="draw-ready">🎰 开奖时间到！可以进行开奖了！</div>
                `;
            }
        } catch (error) {

        }
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// 获取下次开奖时间
function getNextDrawTime() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 21, 15, 0); // 21:15开奖
    
    // 如果今天已过开奖时间，则计算下一个开奖日
    if (now > today) {
        today.setDate(today.getDate() + 1);
    }
    
    // 找到下一个周二、四、日
    while (![0, 2, 4].includes(today.getDay())) {
        today.setDate(today.getDate() + 1);
    }
    
    return today;
}

// 添加额外样式
function addAdditionalStyles() {
    if (document.getElementById('additionalStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'additionalStyles';
    style.textContent = `
        .countdown-display {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .countdown-item {
            background: linear-gradient(135deg, #3498db, #2980b9);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
            color: white;
            min-width: 60px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .countdown-number {
            display: block;
            font-size: 2em;
            font-weight: bold;
            line-height: 1;
        }
        
        .countdown-label {
            display: block;
            font-size: 0.9em;
            margin-top: 5px;
            opacity: 0.9;
        }
        
        .next-draw-info {
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 10px;
        }
        
        .draw-ready {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            font-size: 1.3em;
            font-weight: bold;
            animation: readyPulse 1s infinite;
        }
        
        @keyframes urgentBlink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes readyPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        @keyframes numberPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .check-result-item {
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin: 15px 0;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .check-result-item.has-winning {
            border-color: #27ae60;
            background: linear-gradient(135deg, #d5f4e6, #ffffff);
        }
        
        .result-header h4 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .result-summary {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .tickets-detail {
            margin-top: 15px;
        }
        
        .ticket-check-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .ticket-check-item.won {
            background: linear-gradient(135deg, #d5f4e6, #c8e6c9);
            border-left: 4px solid #27ae60;
        }
        
        .ticket-check-item.claimed {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border-left: 4px solid #f39c12;
        }
        
        .ticket-check-item.lost {
            background: linear-gradient(135deg, #fadbd8, #f5b7b1);
            border-left: 4px solid #e74c3c;
        }
        
        .ticket-result {
            font-weight: bold;
        }
        
        .ticket-check-item.won .ticket-result {
            color: #27ae60;
        }
        
        .ticket-check-item.claimed .ticket-result {
            color: #f39c12;
        }
        
        .ticket-check-item.lost .ticket-result {
            color: #e74c3c;
        }
        
        .error-text {
            color: #e74c3c;
            font-style: italic;
            font-size: 0.9em;
        }
    `;
    document.head.appendChild(style);
}
// 在文件末尾添加缺失的函数定义

// 🔥 添加开奖动画效果
function startDrawAnimation() {
    // 🔥 防止重复执行
    if (window.drawAnimationRunning) {
        console.log('⚠️ 开奖动画正在运行中，忽略重复调用');
        return;
    }
    
    window.drawAnimationRunning = true;
    console.log('🎬 开始增强版开奖动画');
    
    // 🔥 初始化全局开奖结果
    window.currentDrawResult = {
        type: currentDrawType,
        period: getCurrentPeriod(currentDrawType),
        drawTime: new Date().toLocaleString()
    };
    
    console.log('🎯 初始化开奖结果对象:', window.currentDrawResult);
    
    // 创建开奖动画容器
    const animationContainer = document.createElement('div');
    animationContainer.id = 'drawAnimation';
    animationContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(0, 20, 40, 0.95), rgba(20, 40, 80, 0.95));
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        backdrop-filter: blur(10px);
    `;
    
    animationContainer.innerHTML = `
        <div class="draw-animation-content">
            <h2 style="font-size: 36px; margin-bottom: 20px; text-align: center; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                🎰 ${currentDrawType === 'doubleColor' ? '双色球' : '大乐透'} 开奖中
            </h2>
            <div class="stage-indicator" id="stageIndicator" style="
                font-size: 20px; 
                margin-bottom: 30px; 
                text-align: center; 
                color: #ffd700;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            ">🎲 正在准备号码池...</div>
            
            <!-- 号码池容器 -->
            <div class="number-pool-container" style="
                width: 600px;
                height: 300px;
                background: linear-gradient(135deg, #1e3c72, #2a5298);
                border-radius: 20px;
                position: relative;
                margin: 20px auto;
                box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8);
                overflow: hidden;
                border: 3px solid rgba(255, 215, 0, 0.3);
            ">
                <div class="pool-header" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 40px;
                    background: linear-gradient(90deg, #ffd700, #ffed4e);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: #1e3c72;
                    font-size: 16px;
                ">号码池</div>
                
                <div class="number-pool" id="numberPool" style="
                    position: absolute;
                    top: 50px;
                    left: 20px;
                    right: 20px;
                    bottom: 50px;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: flex-start;
                    justify-content: center;
                    gap: 8px;
                    overflow: hidden;
                    padding: 10px;
                "></div>
                
                <div class="selected-area" id="selectedArea" style="
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: linear-gradient(90deg, rgba(231, 76, 60, 0.9), rgba(192, 57, 43, 0.9));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    border-top: 2px solid rgba(255, 215, 0, 0.5);
                ">
                    <span style="color: white; font-weight: bold; margin-right: 10px;">已选号码:</span>
            </div>
            </div>
            
            <div class="draw-progress" style="
                width: 500px;
                height: 8px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 4px;
                margin: 30px auto 20px;
                overflow: hidden;
                border: 1px solid rgba(255, 215, 0, 0.3);
            ">
                <div class="progress-bar" id="progressBar" style="
                    width: 0%;
                    height: 100%;
                    background: linear-gradient(90deg, #ffd700, #ff6b35);
                    border-radius: 4px;
                    transition: width 0.5s ease;
                "></div>
            </div>
            
            <p id="statusText" style="font-size: 18px; text-align: center; opacity: 0.9; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">
                正在初始化摇奖机...
            </p>
        </div>
    `;
    
    document.body.appendChild(animationContainer);
    
    // 🔥 播放开场动画音效
    audioManager.playSound(100, 0.3, 0.1);
    setTimeout(() => audioManager.playSound(150, 0.25, 0.08), 200);
    setTimeout(() => audioManager.playSound(200, 0.2, 0.06), 400);
    
    // 创建号码池并开始动画
    setTimeout(() => {
        createNumberPool();
        startNumberPoolAnimation();
    }, 500);
    
    // 添加必要的样式
    addEnhancedDrawAnimationStyles();
}

// 🚀 性能优化：创建号码池（使用DocumentFragment和requestAnimationFrame）
function createNumberPool() {
    const pool = document.getElementById('numberPool');
    if (!pool) return;
    
    let maxNumbers, ballColor;
    if (currentDrawType === 'doubleColor') {
        maxNumbers = 33;
        ballColor = '#e74c3c'; // 双色球红球
    } else {
        maxNumbers = 35;
        ballColor = '#e74c3c'; // 大乐透前区球也是红色
    }
    
    // 使用DocumentFragment批量创建
    const fragment = document.createDocumentFragment();
    
    // 分批创建，避免长任务
    const batchSize = 10;
    let currentBatch = 0;
    
    function createBatch() {
        const start = currentBatch * batchSize + 1;
        const end = Math.min((currentBatch + 1) * batchSize, maxNumbers);
        
        for (let i = start; i <= end; i++) {
            const ball = document.createElement('div');
            ball.className = 'pool-ball';
            ball.dataset.number = i;
            ball.style.cssText = `
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${ballColor}, ${ballColor}dd);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                animation: poolBallFloat ${Math.random() * 2 + 3}s ease-in-out infinite alternate;
                transform: translateY(${Math.random() * 10}px);
            `;
            ball.textContent = String(i).padStart(2, '0');
            fragment.appendChild(ball);
        }
        
        currentBatch++;
        
        if (end < maxNumbers) {
            // 使用requestAnimationFrame分批处理
            requestAnimationFrame(createBatch);
        } else {
            // 最后一次性添加到DOM
            pool.appendChild(fragment);
        }
    }
    
    // 开始分批创建
    createBatch();
}

// 🔥 新增：开始号码池动画
function startNumberPoolAnimation() {
    const stageIndicator = document.getElementById('stageIndicator');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    
    if (!stageIndicator || !statusText || !progressBar) return;
    
    // 第一阶段：号码池滚动
    stageIndicator.textContent = '🎲 号码池正在混合中...';
    statusText.textContent = '正在打乱号码顺序...';
    progressBar.style.width = '20%';
    
    startPoolMixing();
    
    // 第二阶段：开始选号
    setTimeout(() => {
        stageIndicator.textContent = '🎯 开始选择号码...';
        statusText.textContent = '正在从号码池中选出号码...';
        progressBar.style.width = '50%';
        startNumberSelection();
    }, 3000);
}

// 🔥 新增：号码池混合动画
function startPoolMixing() {
    const poolBalls = document.querySelectorAll('.pool-ball');
    
    // 🔥 播放号码池混合开始音效
    audioManager.playSound(150, 0.3, 0.08);
    setTimeout(() => audioManager.playSound(200, 0.2, 0.06), 100);
    setTimeout(() => audioManager.playSound(250, 0.2, 0.06), 200);
    
    poolBalls.forEach((ball, index) => {
        const delay = Math.random() * 1000;
        setTimeout(() => {
            ball.style.animation = `poolBallMix 0.8s ease-in-out infinite alternate`;
            
            // 🔥 为每个球添加轻微的混合音效
            if (Math.random() < 0.3) { // 只有30%的球播放音效，避免太嘈杂
                audioManager.playSound(180 + Math.random() * 100, 0.05, 0.03);
            }
        }, delay);
    });
    
    // 🔥 持续播放混合过程中的背景音效
    const mixingInterval = setInterval(() => {
        audioManager.playSound(160 + Math.random() * 80, 0.08, 0.04);
    }, 300);
    
    // 3秒后停止背景音效
    setTimeout(() => {
        clearInterval(mixingInterval);
    }, 3000);
}

// 🔥 新增：开始号码选择过程
function startNumberSelection() {
    const poolBalls = document.querySelectorAll('.pool-ball');
    const selectedArea = document.getElementById('selectedArea');
    const progressBar = document.getElementById('progressBar');
    
    if (!selectedArea || !progressBar) return;
    
    let requiredCount = currentDrawType === 'doubleColor' ? 6 : 5;
    let selectedNumbers = [];
    let selectionInterval;
    let highlightCount = 0;
    
    // 高亮显示过程
    selectionInterval = setInterval(() => {
        // 清除之前的高亮
        poolBalls.forEach(ball => {
            ball.style.transform = 'scale(1)';
            ball.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        });
        
        // 随机高亮一些球
        const randomBalls = Array.from(poolBalls)
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(8, poolBalls.length));
            
        randomBalls.forEach(ball => {
            ball.style.transform = 'scale(1.2)';
            ball.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.8)';
        });
        
        // 🔥 播放高亮音效
        const frequency = 300 + Math.random() * 200; // 300-500Hz的随机频率
        audioManager.playSound(frequency, 0.08, 0.05);
        
        highlightCount++;
        
        // 20次高亮后开始确定号码
        if (highlightCount >= 20) {
            clearInterval(selectionInterval);
            
            // 🔥 播放选择完成音效
            audioManager.playSound(600, 0.2, 0.08);
            setTimeout(() => audioManager.playSound(800, 0.15, 0.06), 200);
            
            confirmSelectedNumbers();
        }
    }, 150);
    
    // 确定选中的号码
    function confirmSelectedNumbers() {
        // 生成最终号码
        const finalNumbers = generateRandomNumbers(
            currentDrawType === 'doubleColor' ? 33 : 35, 
            requiredCount
        );
        
        // 🔥 初始化全局开奖结果对象
        if (!window.currentDrawResult) {
            window.currentDrawResult = {};
        }
        
        // 🔥 保存红球/前区球号码到全局结果
        if (currentDrawType === 'doubleColor') {
            window.currentDrawResult.red = finalNumbers;
            window.currentDrawResult.numbers = finalNumbers; // 兼容原有逻辑
        } else {
            window.currentDrawResult.front = finalNumbers;
            window.currentDrawResult.frontNumbers = finalNumbers; // 兼容原有逻辑
        }
        
        console.log('🎯 已保存号码到全局结果:', currentDrawType === 'doubleColor' ? '红球' : '前区球', finalNumbers);
        
        finalNumbers.forEach((num, index) => {
            setTimeout(() => {
                selectNumberFromPool(num, selectedArea);
                
                // 更新进度
                const progress = 50 + (index + 1) / requiredCount * 30;
                progressBar.style.width = `${progress}%`;
                
                if (index === finalNumbers.length - 1) {
                    // 红球/前区球选择完成
                    setTimeout(() => {
                        if (currentDrawType === 'doubleColor') {
                            startBlueballSelection();
                        } else {
                            startBackballSelection();
                        }
                    }, 1000);
                }
            }, index * 800);
        });
    }
}

// 🔥 新增：从号码池中选择号码
function selectNumberFromPool(number, selectedArea) {
    const poolBall = document.querySelector(`.pool-ball[data-number="${number}"]`);
    if (!poolBall) return;
    
    // 高亮选中的球
    poolBall.style.animation = 'ballSelected 0.8s ease-out';
    poolBall.style.transform = 'scale(1.5)';
    poolBall.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.9)';
    
    // 播放选中音效
    audioManager.playSound(800, 0.1, 0.1);
    
    // 创建选中区域的球
    setTimeout(() => {
        const selectedBall = poolBall.cloneNode(true);
        // 保持原有球的颜色，只是稍微调整尺寸
        selectedBall.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: ${poolBall.style.background || 'linear-gradient(135deg, #e74c3c, #c0392b)'};
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(39, 174, 96, 0.6);
            animation: ballAppearInSelected 0.6s ease-out;
            margin: 0 5px;
        `;
        selectedArea.appendChild(selectedBall);
        
        // 移除原球（淡出效果）
        poolBall.style.opacity = '0.3';
        poolBall.style.transform = 'scale(0.8)';
    }, 400);
}

// 🔥 新增：蓝球选择过程
function startBlueballSelection() {
    const stageIndicator = document.getElementById('stageIndicator');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    
    if (!stageIndicator || !statusText || !progressBar) return;
    
    stageIndicator.textContent = '🔵 正在选择蓝球...';
    statusText.textContent = '从16个蓝球中选择1个...';
    progressBar.style.width = '85%';
    
    // 🔥 播放蓝球选择开始音效
    audioManager.playSound(350, 0.2, 0.08);
    setTimeout(() => audioManager.playSound(450, 0.15, 0.06), 150);
    
    // 重新创建蓝球号码池
    createBlueBallPool();
    
    // 🔥 蓝球混合音效
    const blueMixingInterval = setInterval(() => {
        audioManager.playSound(400 + Math.random() * 100, 0.06, 0.04);
    }, 200);
    
    // 2秒后选择蓝球
    setTimeout(() => {
        clearInterval(blueMixingInterval);
        
        // 🔥 播放蓝球确定前音效
        audioManager.playSound(500, 0.15, 0.07);
        setTimeout(() => audioManager.playSound(600, 0.12, 0.06), 100);
        
        const blueNumber = Math.floor(Math.random() * 16) + 1;
        
        // 🔥 保存蓝球号码到全局结果
        if (!window.currentDrawResult) {
            window.currentDrawResult = {};
        }
        window.currentDrawResult.blue = blueNumber;
        window.currentDrawResult.blueNumber = blueNumber; // 兼容原有逻辑
        
        console.log('🔵 已保存蓝球号码到全局结果:', blueNumber);
        
        selectBlueBall(blueNumber);
        
        setTimeout(() => {
            finishDrawAnimation();
        }, 2000);
    }, 2000);
}

// 🔥 新增：创建蓝球池
function createBlueBallPool() {
    const pool = document.getElementById('numberPool');
    if (!pool) return;
    
    // 清空原有球
    pool.innerHTML = '';
    
    // 创建16个蓝球
    for (let i = 1; i <= 16; i++) {
        const ball = document.createElement('div');
        ball.className = 'blue-pool-ball';
        ball.dataset.number = i;
        ball.style.cssText = `
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            animation: poolBallFloat ${Math.random() * 2 + 3}s ease-in-out infinite alternate;
            transform: translateY(${Math.random() * 10}px);
        `;
        ball.textContent = String(i).padStart(2, '0');
        pool.appendChild(ball);
    }
}

// 🔥 新增：选择蓝球
function selectBlueBall(number) {
    const selectedArea = document.getElementById('selectedArea');
    if (!selectedArea) return;
    
    const blueBall = document.querySelector(`.blue-pool-ball[data-number="${number}"]`);
    if (blueBall) {
        blueBall.style.animation = 'ballSelected 0.8s ease-out';
        blueBall.style.transform = 'scale(1.5)';
        blueBall.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.9)';
    }
    
    // 播放选中音效
    audioManager.playSound(1000, 0.1, 0.1);
    
    // 在选中区域添加蓝球
    setTimeout(() => {
        const selectedBall = document.createElement('div');
        selectedBall.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.6);
            animation: ballAppearInSelected 0.6s ease-out;
            margin: 0 5px;
        `;
        selectedBall.textContent = String(number).padStart(2, '0');
        selectedArea.appendChild(selectedBall);
    }, 400);
}

// 🔥 新增：后区球选择（大乐透）
function startBackballSelection() {
    const stageIndicator = document.getElementById('stageIndicator');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    
    if (!stageIndicator || !statusText || !progressBar) return;
    
    stageIndicator.textContent = '🟡 正在选择后区球...';
    statusText.textContent = '从12个后区球中选择2个...';
    progressBar.style.width = '85%';
    
    // 🔥 播放后区球选择开始音效
    audioManager.playSound(320, 0.2, 0.08);
    setTimeout(() => audioManager.playSound(380, 0.15, 0.06), 150);
    
    // 重新创建后区球号码池
    createBackBallPool();
    
    // 🔥 后区球混合音效
    const backMixingInterval = setInterval(() => {
        audioManager.playSound(350 + Math.random() * 80, 0.06, 0.04);
    }, 250);
    
    // 2秒后选择后区球
    setTimeout(() => {
        clearInterval(backMixingInterval);
        
        // 🔥 播放后区球确定前音效
        audioManager.playSound(480, 0.15, 0.07);
        setTimeout(() => audioManager.playSound(560, 0.12, 0.06), 100);
        
        const backNumbers = generateRandomNumbers(12, 2);
        
        // 🔥 保存后区球号码到全局结果
        if (!window.currentDrawResult) {
            window.currentDrawResult = {};
        }
        window.currentDrawResult.back = backNumbers;
        window.currentDrawResult.backNumbers = backNumbers; // 兼容原有逻辑
        
        console.log('🟡 已保存后区球号码到全局结果:', backNumbers);
        
        backNumbers.forEach((num, index) => {
            setTimeout(() => {
                selectBackBall(num);
                if (index === backNumbers.length - 1) {
                    setTimeout(() => {
                        finishDrawAnimation();
                    }, 2000);
                }
            }, index * 1000);
        });
    }, 2000);
}

// 🔥 新增：创建后区球池
function createBackBallPool() {
    const pool = document.getElementById('numberPool');
    if (!pool) return;
    
    // 清空原有球
    pool.innerHTML = '';
    
    // 创建12个后区球
    for (let i = 1; i <= 12; i++) {
        const ball = document.createElement('div');
        ball.className = 'back-pool-ball';
        ball.dataset.number = i;
        ball.style.cssText = `
            width: 35px;
            height: 35px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            animation: poolBallFloat ${Math.random() * 2 + 3}s ease-in-out infinite alternate;
            transform: translateY(${Math.random() * 10}px);
        `;
        ball.textContent = String(i).padStart(2, '0');
        pool.appendChild(ball);
    }
}

// 🔥 新增：选择后区球
function selectBackBall(number) {
    const selectedArea = document.getElementById('selectedArea');
    if (!selectedArea) return;
    
    const backBall = document.querySelector(`.back-pool-ball[data-number="${number}"]`);
    if (backBall) {
        backBall.style.animation = 'ballSelected 0.8s ease-out';
        backBall.style.transform = 'scale(1.5)';
        backBall.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.9)';
    }
    
    // 🔥 播放后区球选中音效（更高频率，区别于前区球）
    audioManager.playSound(900, 0.12, 0.08);
    setTimeout(() => audioManager.playSound(1100, 0.08, 0.06), 100);
    
    // 在选中区域添加后区球
    setTimeout(() => {
        const selectedBall = document.createElement('div');
        selectedBall.style.cssText = `
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(52, 152, 219, 0.6);
            animation: ballAppearInSelected 0.6s ease-out;
            margin: 0 5px;
        `;
        selectedBall.textContent = String(number).padStart(2, '0');
        selectedArea.appendChild(selectedBall);
    }, 400);
}

// 🔥 新增：完成开奖动画
function finishDrawAnimation() {
    const stageIndicator = document.getElementById('stageIndicator');
    const statusText = document.getElementById('statusText');
    const progressBar = document.getElementById('progressBar');
    
    if (stageIndicator) stageIndicator.textContent = '🎉 开奖完成！';
    if (statusText) statusText.textContent = '号码选择完毕，即将显示结果...';
    if (progressBar) progressBar.style.width = '100%';
    
    // 🔥 确保数据完整性
    if (window.currentDrawResult) {
        console.log('✅ 开奖动画完成，最终结果数据:', window.currentDrawResult);
        
        // 添加兼容字段
        if (currentDrawType === 'doubleColor') {
            if (window.currentDrawResult.red && window.currentDrawResult.blue) {
                window.currentDrawResult.numbers = window.currentDrawResult.red;
                window.currentDrawResult.blueNumber = window.currentDrawResult.blue;
            }
        } else {
            if (window.currentDrawResult.front && window.currentDrawResult.back) {
                window.currentDrawResult.frontNumbers = window.currentDrawResult.front;
                window.currentDrawResult.backNumbers = window.currentDrawResult.back;
            }
        }
    }
    
    // 播放完成音效
    audioManager.playSound(1200, 0.2, 0.5);
    
    // 5秒后关闭动画并继续到结果显示
    setTimeout(() => {
        const animationContainer = document.getElementById('drawAnimation');
        if (animationContainer) {
            animationContainer.style.opacity = '0';
            animationContainer.style.transition = 'opacity 0.5s ease';
            
            setTimeout(() => {
                if (animationContainer.parentNode) {
                    animationContainer.parentNode.removeChild(animationContainer);
                }
                
                // 🔥 动画完成后直接显示最终结果
                console.log('🎯 动画结束，继续显示开奖结果...');
                
                // 🔥 重置动画运行标志
                window.drawAnimationRunning = false;
                
                showFinalDrawResults();
            }, 500);
        }
    }, 5000);
}

// 🔥 新增：添加增强版动画样式
function addEnhancedDrawAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes poolBallFloat {
            0% { transform: translateY(0px) rotate(0deg); }
            100% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes poolBallMix {
            0% { transform: translateY(0px) rotate(0deg) scale(1); }
            50% { transform: translateY(-15px) rotate(180deg) scale(1.1); }
            100% { transform: translateY(0px) rotate(360deg) scale(1); }
        }
        
        @keyframes ballSelected {
            0% { transform: scale(1); box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
            50% { transform: scale(1.8); box-shadow: 0 8px 25px rgba(255, 215, 0, 1); }
            100% { transform: scale(1.5); box-shadow: 0 6px 20px rgba(255, 215, 0, 0.9); }
        }
        
        @keyframes ballAppearInSelected {
            0% { transform: scale(0) rotate(180deg); opacity: 0; }
            50% { transform: scale(1.3) rotate(90deg); opacity: 0.8; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// 创建滚动球效果
function createRollingBalls() {
    const ballsContainer = document.getElementById('machineBalls');
    if (!ballsContainer) return;
    
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'];
    
    for (let i = 0; i < 20; i++) {
        const ball = document.createElement('div');
        ball.style.cssText = `
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            animation: ballBounce ${0.5 + Math.random() * 1}s ease-in-out infinite alternate;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        ballsContainer.appendChild(ball);
    }
}

// 开奖系统函数
function startDraw() {
    console.log('🎲 开始开奖流程');
    
    const drawBtn = document.querySelector('.btn-draw');
    if (drawBtn) {
        drawBtn.disabled = true;
        drawBtn.textContent = '🎰 摇奖进行中...';
    }
    
    // 播放开奖前音效
    playDrawStartSound();
    
    // 🔥 添加开奖动画
    startDrawAnimation();
    
    // 显示摇奖机动画
    showDrawMachine();
    
    // 🔥 不再执行原有开奖逻辑，新动画会直接处理所有选号过程
    // 原有的 performDoubleColorDraw() 和 performDaletouDraw() 已被新动画流程替代
}

// 显示摇奖机动画
function showDrawMachine() {
    const drawBalls = document.getElementById('drawBalls');
    if (!drawBalls) return;
    
    drawBalls.innerHTML = `
        <div class="draw-machine-container">
            <div class="machine-body">
                <div class="machine-title">🎰 ${currentDrawType === 'doubleColor' ? '双色球' : '大乐透'}摇奖机</div>
                <div class="ball-chamber" id="ballChamber">
                    <div class="chamber-label">摇奖中...</div>
                    <div class="spinning-balls" id="spinningBalls"></div>
                </div>
                <div class="result-area" id="resultArea">
                    <div class="result-label">开奖结果</div>
                    <div class="result-balls" id="finalResults"></div>
                </div>
            </div>
        </div>
    `;
    
    // 添加摇奖机样式
    addDrawMachineStyles();
}

// 添加摇奖机样式
function addDrawMachineStyles() {
    if (document.getElementById('drawMachineStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'drawMachineStyles';
    style.textContent = `
        .draw-machine-container {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            border-radius: 20px;
            padding: 30px;
            margin: 20px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            border: 3px solid #f39c12;
        }
        
        .machine-body {
            background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
        }
        
        .machine-title {
            font-size: 1.5em;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        
        .ball-chamber {
            background: linear-gradient(135deg, #3498db, #2980b9);
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            min-height: 120px;
            position: relative;
            overflow: hidden;
        }
        
        .chamber-label {
            color: white;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 15px;
        }
        
        .spinning-balls {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            min-height: 60px;
        }
        
        .result-area {
            background: linear-gradient(135deg, #27ae60, #2ecc71);
            border-radius: 15px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .result-label {
            color: white;
            font-weight: bold;
            font-size: 1.2em;
            margin-bottom: 15px;
        }
        
        .result-balls {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            min-height: 60px;
        }
    `;
    document.head.appendChild(style);
}

// 🔥 旧的开奖函数已被新的动画系统替代，这里保留空函数以防兼容性问题
function performDoubleColorDraw() {
    console.log('⚠️ 旧开奖函数被调用，已被新动画系统替代');
}

function performDaletouDraw() {
    console.log('⚠️ 旧开奖函数被调用，已被新动画系统替代');
}

// 显示旋转的球
function showSpinningBalls(type) {
    const spinningBalls = document.getElementById('spinningBalls');
    const chamberLabel = document.querySelector('.chamber-label');
    
    if (!spinningBalls || !chamberLabel) return;
    
    chamberLabel.textContent = '🎰 号码球激烈摇奖中...';
    
    // 创建旋转的球
    const ballCount = type === 'doubleColor' ? 15 : 20;
    
    for (let i = 0; i < ballCount; i++) {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'spinning-ball';
            ball.style.background = getRandomBallColor();
            ball.textContent = Math.floor(Math.random() * 35) + 1;
            ball.style.animationDelay = `${Math.random() * 0.5}s`;
            spinningBalls.appendChild(ball);
            
            // 播放球出现音效
            playBallAppearSound();
        }, i * 100);
    }
}

// 获取随机球颜色
function getRandomBallColor() {
    const colors = [
        'linear-gradient(45deg, #e74c3c, #c0392b)',
        'linear-gradient(45deg, #3498db, #2980b9)',
        'linear-gradient(45deg, #f39c12, #e67e22)',
        'linear-gradient(45deg, #9b59b6, #8e44ad)',
        'linear-gradient(45deg, #27ae60, #2ecc71)'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 摇出红球
function drawRedBalls() {
    console.log('⚠️ 旧的红球生成函数被调用，已被新动画系统替代');
}

// 摇出蓝球
function drawBlueBall() {
    console.log('⚠️ 旧的蓝球生成函数被调用，已被新动画系统替代');
}

// 摇出前区球
function drawFrontBalls() {
    console.log('⚠️ 旧的前区球生成函数被调用，已被新动画系统替代');
}

// 摇出后区球
function drawBackBalls() {
    console.log('⚠️ 旧的后区球生成函数被调用，已被新动画系统替代');
}

// 显示最终开奖结果
function showFinalDrawResults() {
    try {
        console.log('🎉 显示最终开奖结果');
        
        // 🔥 修复：确保window.currentDrawResult存在且有效
        if (!window.currentDrawResult || typeof window.currentDrawResult !== 'object') {
            console.error('❌ 开奖结果数据无效，使用默认数据');
            window.currentDrawResult = {
                numbers: [],
                blueNumber: null,
                frontNumbers: [],
                backNumbers: [],
                type: currentDrawType || 'doubleColor'
            };
        }
        
        // 确保numbers数组存在
        if (!Array.isArray(window.currentDrawResult.numbers)) {
            window.currentDrawResult.numbers = [];
        }
        
        const chamberLabel = document.querySelector('.chamber-label');
        if (chamberLabel) {
            chamberLabel.textContent = '🎉 开奖完成！';
        }
        
        // 清除旋转的球
        const spinningBalls = document.getElementById('spinningBalls');
        if (spinningBalls) {
            spinningBalls.innerHTML = '';
        }
        
        // 保存开奖结果
        const result = {
            type: currentDrawType,
            period: getCurrentPeriod(currentDrawType),
            drawTime: new Date().toLocaleString(),
            ...window.currentDrawResult
        };
        
        drawResults[currentDrawType].push(result);
        
        // 播放开奖完成音效
        playDrawCompleteSound();
        
        // 显示庆祝动画
        showCelebrationAnimation();
        
        // 自动检查中奖
        setTimeout(() => {
            checkWinningTickets(result);
            updateDrawHistory();
            
            // 恢复开奖按钮
            const drawBtn = document.querySelector('.btn-draw');
            if (drawBtn) {
                drawBtn.disabled = false;
                drawBtn.textContent = '🎰 开始摇奖';
            }
        }, 3000);
        
        // 保存数据
        saveData();
        
    } catch (error) {
        console.error('❌ 显示开奖结果失败:', error);
        // 显示错误提示
        const chamberLabel = document.querySelector('.chamber-label');
        if (chamberLabel) {
            chamberLabel.textContent = '❌ 开奖失败，请重试';
        }
        
        // 🔥 确保在错误情况下也能恢复按钮和移除动画
        const drawBtn = document.querySelector('.btn-draw');
        if (drawBtn) {
            drawBtn.disabled = false;
            drawBtn.textContent = '🎰 开始摇奖';
        }
        
        // 强制移除动画覆盖层
        const animationContainer = document.getElementById('drawAnimation');
        if (animationContainer && animationContainer.parentNode) {
            animationContainer.parentNode.removeChild(animationContainer);
        }
        
        // 🔥 重置动画运行标志
        window.drawAnimationRunning = false;
    }
}

// 显示庆祝动画
function showCelebrationAnimation() {
    console.log('🎊 开始庆祝动画');
    
    // 创建彩带效果
    createConfetti();
    
    // 播放庆祝音效
    if (typeof playWinningSound === 'function') {
        playWinningSound();
    }
    
    // 添加页面震动效果
    document.body.style.animation = 'celebration 1s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 1000);
}

// 创建彩带
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            z-index: 10000;
            border-radius: 50%;
            animation: confettiFall ${2 + Math.random() * 3}s linear forwards;
        `;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
    
    // 添加下落动画
    if (!document.getElementById('confettiStyles')) {
        const style = document.createElement('style');
        style.id = 'confettiStyles';
        style.textContent = `
            @keyframes confettiFall {
                0% {
                    transform: translateY(-10px) rotate(0deg);
                    opacity: 1;
                }
                100% {
                    transform: translateY(100vh) rotate(360deg);
                    opacity: 0;
                }
            }
            @keyframes ballAppear {
            0% {
                opacity: 0;
                transform: scale(0) rotate(180deg);
            }
            50% {
                opacity: 1;
                transform: scale(1.3) rotate(90deg);
            }
            100% {
                opacity: 1;
                transform: scale(1) rotate(0deg);
            }
        }
        @keyframes celebration {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }
        @keyframes machineRotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes progressFill {
            0% { width: 0%; }
            100% { width: 100%; }
        }
        @keyframes ballBounce {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-10px); }
        }
        `;
        document.head.appendChild(style);
    }
}

// 🔥 重新设计：检查所有彩票中奖情况
function checkAllTickets() {
    // 更新待开奖彩票显示
    updatePendingTicketsDisplay();
    // 更新中奖彩票显示
    updateWinningTicketsDisplay();
}

// 🔥 新增：添加示例大乐透历史记录（用于测试）
function addSampleDaletouHistory() {
    if (drawResults.daletou.length === 0) {
        console.log('🎯 添加示例大乐透开奖记录');
        
        const sampleResults = [
            {
                type: 'daletou',
                period: '2025096',
                drawTime: '2025/1/19 20:30:00',
                timestamp: new Date('2025/1/19 20:30:00').getTime(),
                front: [3, 11, 19, 25, 33],
                frontNumbers: [3, 11, 19, 25, 33],
                back: [2, 9],
                backNumbers: [2, 9]
            },
            {
                type: 'daletou',
                period: '2025095',
                drawTime: '2025/1/17 20:30:00',
                timestamp: new Date('2025/1/17 20:30:00').getTime(),
                front: [5, 12, 18, 22, 31],
                frontNumbers: [5, 12, 18, 22, 31],
                back: [4, 11],
                backNumbers: [4, 11]
            },
            {
                type: 'daletou',
                period: '2025094',
                drawTime: '2025/1/15 20:30:00',
                timestamp: new Date('2025/1/15 20:30:00').getTime(),
                front: [1, 8, 16, 27, 35],
                frontNumbers: [1, 8, 16, 27, 35],
                back: [6, 10],
                backNumbers: [6, 10]
            }
        ];
        
        drawResults.daletou = sampleResults;
        saveData();
        console.log('✅ 示例大乐透记录已添加');
        
        // 🔥 如果当前在历史页面且显示大乐透，立即刷新显示
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'history') {
            const activeHistoryBtn = document.querySelector('.history-type-btn.active');
            if (activeHistoryBtn && activeHistoryBtn.textContent.includes('大乐透')) {
                setTimeout(() => loadHistoryData('daletou'), 100);
            }
        }
    }
}

// 🔥 新增：添加示例中奖记录（用于演示）
function addSampleWinningTickets() {
    // 检查是否已有中奖记录
    const existingWinningTickets = userTickets.filter(t => t.status === 'won' || t.status === 'claimed');
    
    if (existingWinningTickets.length === 0) {
        console.log('🎯 添加示例中奖记录');
        
        const sampleWinningTickets = [
            {
                id: 'sample_won_1',
                lotteryType: 'doubleColor',
                type: 'doubleColor',
                period: '2025097',
                purchaseTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
                cost: 2,
                status: 'won', // 未兑奖
                numbers: [3, 11, 19, 25, 33, 35],
                red: [3, 11, 19, 25, 33, 35],
                blueNumber: 7,
                blue: 7,
                prizeLevel: '五等奖',
                prizeAmount: 10,
                prizeName: '五等奖'
            },
            {
                id: 'sample_won_2',
                lotteryType: 'doubleColor',
                type: 'doubleColor',
                period: '2025096',
                purchaseTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
                cost: 2,
                status: 'claimed', // 已兑奖
                claimed: true,
                claimTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                numbers: [5, 12, 18, 22, 31, 35],
                red: [5, 12, 18, 22, 31, 35],
                blueNumber: 9,
                blue: 9,
                prizeLevel: '六等奖',
                prizeAmount: 5,
                prizeName: '六等奖'
            },
            {
                id: 'sample_won_3',
                lotteryType: 'daletou',
                type: 'daletou',
                period: '2025095',
                purchaseTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5天前
                cost: 2,
                status: 'won', // 未兑奖
                frontNumbers: [1, 8, 16, 27, 35],
                front: [1, 8, 16, 27, 35],
                backNumbers: [6, 10],
                back: [6, 10],
                prizeLevel: '四等奖',
                prizeAmount: 200,
                prizeName: '四等奖'
            }
        ];
        
        // 添加到用户票据
        userTickets.push(...sampleWinningTickets);
        
        // 更新统计
        stats.totalWins += sampleWinningTickets.length;
        stats.totalWinnings += sampleWinningTickets.reduce((sum, t) => sum + t.prizeAmount, 0);
        
        saveData();
        console.log('✅ 示例中奖记录已添加');
        
        // 🔥 如果当前在中奖查询页面，立即刷新显示
        const currentTab = document.querySelector('.tab-content.active');
        if (currentTab && currentTab.id === 'check') {
            setTimeout(() => {
                updatePendingTicketsDisplay();
                updateWinningTicketsDisplay();
            }, 100);
        }
    }
}

// 🔥 新增：更新待开奖彩票显示
function updatePendingTicketsDisplay() {
    const container = document.getElementById('pendingTickets');
    if (!container) return;
    
    // 获取待开奖的彩票（状态为waiting）
    const pendingTickets = userTickets.filter(ticket => ticket.status === 'waiting');
    
    if (pendingTickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px;">暂无待开奖彩票</p>';
        return;
    }
    
    // 按购买时间倒序排列，最新的在前
    const sortedTickets = pendingTickets.sort((a, b) => new Date(b.purchaseTime) - new Date(a.purchaseTime));
    
    container.innerHTML = sortedTickets.map(ticket => `
        <div class="pending-ticket-item">
            <div class="pending-ticket-header">
                <span class="pending-ticket-type">${ticket.lotteryType === 'doubleColor' ? '双色球' : '大乐透'}</span>
                <span class="pending-ticket-period">期号: ${ticket.period}</span>
            </div>
            <div class="pending-ticket-numbers">
                ${formatTicketNumbers(ticket)}
            </div>
            <div class="pending-ticket-info">
                <span>投注金额: ¥${ticket.cost}</span>
                <span>购买时间: ${new Date(ticket.purchaseTime).toLocaleString().split(' ')[0]}</span>
            </div>
        </div>
    `).join('');
    
    // 如果超过3条记录，添加滚动提示
    if (pendingTickets.length > 3) {
        const scrollHint = document.createElement('div');
        scrollHint.style.cssText = `
            text-align: center;
            padding: 10px;
            color: #6c757d;
            font-size: 14px;
            background: #f8f9fa;
            border-top: 1px solid #dee2e6;
            border-radius: 0 0 12px 12px;
        `;
        scrollHint.textContent = `共 ${pendingTickets.length} 条记录，可滚动查看更多`;
        container.parentNode.appendChild(scrollHint);
    }
}

// 🔥 新增：更新中奖彩票显示
function updateWinningTicketsDisplay() {
    const container = document.getElementById('winningTickets');
    if (!container) return;
    
    // 获取中奖的彩票（状态为won或claimed）
    const winningTickets = userTickets.filter(ticket => ticket.status === 'won' || ticket.status === 'claimed');
    
    if (winningTickets.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px;">暂无中奖记录</p>';
        return;
    }
    
    // 按奖金金额倒序排列，大奖在前
    const sortedWinningTickets = winningTickets.sort((a, b) => (b.prizeAmount || 0) - (a.prizeAmount || 0));
    
    // 生成中奖彩票HTML
    const winningHTML = sortedWinningTickets.map(ticket => createWinningTicketHTML(ticket)).join('');
    container.innerHTML = winningHTML;
}

// 🔥 新增：创建中奖彩票HTML
function createWinningTicketHTML(ticket) {
    const lotteryType = ticket.lotteryType === 'doubleColor' ? '双色球' : '大乐透';
    const prizeAmount = ticket.prizeAmount || 0;
    const prizeLevel = ticket.prizeLevel || ticket.prizeName || '未知奖级';
    
    // 🔥 更完善的状态判断逻辑
    let claimStatus = '';
    let claimStatusClass = '';
    
    if (ticket.status === 'claimed' || ticket.claimed === true) {
        claimStatus = '✅ 已兑奖';
        claimStatusClass = 'status-claimed';
    } else if (ticket.status === 'won') {
        claimStatus = '⏳ 待领奖';
        claimStatusClass = 'status-unclaimed';
    } else {
        claimStatus = '❓ 待核验';
        claimStatusClass = 'status-unknown';
    }
    
    // 获取开奖结果用于对比
    const drawResult = getDrawResultForTicket(ticket);
    
    // 生成完整的号码显示
    const numbersHTML = createWinningNumbersHTML(ticket, drawResult);
    
    // 🔥 添加购买时间和期号信息
    const purchaseDate = new Date(ticket.purchaseTime).toLocaleDateString();
    const period = ticket.period || '未知期号';
        
    return `
        <div class="winning-ticket-item">
            <div class="winning-ticket-header">
                <div class="winning-ticket-type">${lotteryType}</div>
                <div class="winning-prize-info">
                    <div class="winning-prize-level">${prizeLevel}</div>
                    <div class="winning-prize-amount">¥${prizeAmount.toLocaleString()}</div>
                </div>
                <div class="winning-claim-status ${claimStatusClass}">${claimStatus}</div>
            </div>
            
            <div class="winning-ticket-numbers">
                ${numbersHTML}
            </div>
            
            <div class="winning-ticket-details">
                <div class="winning-ticket-info">
                    <span class="ticket-period">期号: ${period}</span>
                    <span class="ticket-date">购买: ${purchaseDate}</span>
                    <span class="ticket-cost">投注: ¥${ticket.cost}</span>
                </div>
                <div class="winning-amount-display">
                    <span class="amount-label">中奖金额：</span>
                    <span class="amount-value">¥${prizeAmount.toLocaleString()}</span>
                </div>
            </div>
        </div>
    `;
}

// 🔥 新增：创建中奖号码显示HTML
function createWinningNumbersHTML(ticket, drawResult) {
    if (ticket.lotteryType === 'doubleColor') {
        // 双色球显示
        const redNumbers = ticket.numbers || [];
        const blueNumber = ticket.blueNumber;
        const winningRed = drawResult ? drawResult.red || [] : [];
        const winningBlue = drawResult ? drawResult.blue : null;
        
        const redHTML = redNumbers.map(num => {
            const isWinning = winningRed.includes(num);
            return `<div class="winning-number-ball red-ball ${isWinning ? 'winning' : ''}">${num.toString().padStart(2, '0')}</div>`;
        }).join('');
        
        const blueHTML = `<div class="winning-number-ball blue-ball ${blueNumber === winningBlue ? 'winning' : ''}">${blueNumber.toString().padStart(2, '0')}</div>`;
        
        return `
            <div class="winning-numbers-display">
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">红球:</span>
                ${redHTML}
                <span class="winning-separator">|</span>
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">蓝球:</span>
                ${blueHTML}
            </div>
        `;
    } else {
        // 大乐透显示
        const frontNumbers = ticket.frontNumbers || [];
        const backNumbers = ticket.backNumbers || [];
        const winningFront = drawResult ? drawResult.front || [] : [];
        const winningBack = drawResult ? drawResult.back || [] : [];
        
        const frontHTML = frontNumbers.map(num => {
            const isWinning = winningFront.includes(num);
            return `<div class="winning-number-ball red-ball ${isWinning ? 'winning' : ''}">${num.toString().padStart(2, '0')}</div>`;
    }).join('');
        
        const backHTML = backNumbers.map(num => {
            const isWinning = winningBack.includes(num);
            return `<div class="winning-number-ball blue-ball ${isWinning ? 'winning' : ''}">${num.toString().padStart(2, '0')}</div>`;
        }).join('');
        
        return `
            <div class="winning-numbers-display">
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">前区:</span>
                ${frontHTML}
                <span class="winning-separator">|</span>
                <span style="color: #7f8c8d; font-weight: bold; margin-right: 8px;">后区:</span>
                ${backHTML}
            </div>
        `;
    }
}

// 🔥 新增：获取彩票对应的开奖结果
function getDrawResultForTicket(ticket) {
    const results = drawResults[ticket.lotteryType];
    if (!results || results.length === 0) return null;
    
    // 如果有期号匹配，找对应期号的结果
    if (ticket.period) {
        return results.find(result => result.period === ticket.period);
    }
    
    // 否则返回最新的开奖结果
    return results[results.length - 1];
}

// 🔥 更新历史页面初始化
function initializeHistoryPage() {
    // 检查历史页面是否可见
    const historyTab = document.getElementById('history');
    if (historyTab && historyTab.classList.contains('active')) {
        // 默认加载双色球历史，延迟一下确保DOM完全渲染
        setTimeout(() => {
            loadHistoryData('doubleColor');
        }, 200);
    }
}

// 🔥 确保在showTab中处理历史页面
if (typeof showTab === 'function') {
    const originalShowTab = showTab;
    window.showTab = function(tabName) {
        // 先执行原始的showTab函数
        originalShowTab(tabName);
        
        // 如果切换到历史页面，初始化历史数据
        if (tabName === 'history') {
            setTimeout(() => {
                try {
                    initializeHistoryPage();
                } catch (error) {
                    console.error('历史页面初始化失败:', error);
                }
            }, 300);
        }
    };
}

// 🔥 更新中奖彩票显示的函数导出
window.switchHistoryType = switchHistoryType;
window.loadHistoryData = loadHistoryData;
window.createHistoryItemHTML = createHistoryItemHTML;
window.createWinningTicketHTML = createWinningTicketHTML;
window.createWinningNumbersHTML = createWinningNumbersHTML;
window.getDrawResultForTicket = getDrawResultForTicket;

// 检查中奖彩票
function checkWinningTickets(drawResult) {
    let hasWinning = false;
    
    userTickets.forEach(ticket => {
        if (ticket.lotteryType === drawResult.type && ticket.period === drawResult.period && ticket.status === 'waiting') {
            const winResult = checkTicketWinning(ticket, drawResult);
            if (winResult.isWin) {
                ticket.status = 'won';
                ticket.prizeLevel = winResult.level;
                ticket.prizeAmount = winResult.amount;
                ticket.prizeName = winResult.name;
                hasWinning = true;
                
                stats.totalWins++;
                stats.totalWinnings += winResult.amount;
                
                console.log(`🎉 彩票中奖！奖级：${winResult.level}，金额：¥${winResult.amount}`);
                
                // 🎉 触发庆祝动画
                if (typeof celebrationManager !== 'undefined') {
                    celebrationManager.triggerLotteryCelebration(
                        winResult.level, 
                        winResult.amount, 
                        ticket.lotteryType
                    );
                }
            } else {
                ticket.status = 'lost';
            }
        }
    });
    
    if (hasWinning) {
        showWinningModal();
        playWinningSound();
    }
    
    updateTicketsList();
    updateStats();
    // 🔥 更新中奖查询页面显示
    updatePendingTicketsDisplay();
    updateWinningTicketsDisplay();
    saveData();
}

// 检查单张彩票中奖情况
function checkTicketWinning(ticket, drawResult) {
    let matches = { main: 0, special: 0 };
    
    if (ticket.lotteryType === 'doubleColor') {
        // 检查红球匹配
        matches.main = ticket.numbers.filter(num => drawResult.red.includes(num)).length;
        // 检查蓝球匹配
        matches.special = ticket.blueNumber === drawResult.blue ? 1 : 0;
    } else {
        // 检查前区匹配
        matches.main = ticket.frontNumbers.filter(num => drawResult.front.includes(num)).length;
        // 检查后区匹配
        matches.special = ticket.backNumbers.filter(num => drawResult.back.includes(num)).length;
    }
    
    const key = `${matches.main}-${matches.special}`;
    const prizeInfo = prizeConfig[ticket.lotteryType][key];
    
    return {
        isWin: !!prizeInfo,
        level: prizeInfo ? prizeInfo.level : 0,
        amount: prizeInfo ? prizeInfo.amount : 0,
        name: prizeInfo ? prizeInfo.name : '未中奖'
    };
}

// 显示中奖弹窗
function showWinningModal() {
    const winningTickets = userTickets.filter(t => t.status === 'won' && !t.claimed);
    if (winningTickets.length === 0) return;
    
    const totalPrize = winningTickets.reduce((sum, t) => sum + (t.prizeAmount || 0), 0);
    
    const modal = document.createElement('div');
    modal.className = 'center-modal';
    modal.innerHTML = `
        <div class="center-modal-overlay" onclick="closeCenterModal()"></div>
        <div class="center-modal-content winning-modal">
            <div class="modal-header">
                <h3>🎉 恭喜中奖！🎉</h3>
                <button class="close-btn" onclick="closeCenterModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="winning-summary">
                    <p>🎫 中奖彩票：${winningTickets.length}张</p>
                    <p>💰 总奖金：¥${totalPrize.toLocaleString()}</p>
                </div>
                <div class="winning-details">
                    ${winningTickets.map(ticket => `
                        <div class="winning-ticket">
                            <div class="ticket-type">${ticket.lotteryType === 'doubleColor' ? '双色球' : '大乐透'}</div>
                            <div class="prize-info">${ticket.prizeName} - ¥${ticket.prizeAmount.toLocaleString()}</div>
                            <div class="ticket-numbers">${formatTicketNumbers(ticket)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="modal-footer">
                <button onclick="claimAllWinnings(); closeCenterModal()" class="btn btn-primary">💰 立即兑奖</button>
                <button onclick="closeCenterModal()" class="btn btn-secondary">稍后兑奖</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    addCenterModalStyles();
}

// 一键兑奖
function claimAllWinnings() {
    const winningTickets = userTickets.filter(t => t.status === 'won' && !t.claimed);
    if (winningTickets.length === 0) {
        if (statusIndicator) {
            statusIndicator.show('没有可兑奖的彩票！', 'warning', 2000);
        }
        return;
    }
    
    const totalPrize = winningTickets.reduce((sum, t) => sum + (t.prizeAmount || 0), 0);
    
    // 标记为已兑奖
    winningTickets.forEach(ticket => {
        ticket.status = 'claimed';
        ticket.claimed = true;
        ticket.claimTime = new Date().toISOString();
    });
    
    // 增加账户余额
    accountBalance += totalPrize;
    
    // 显示兑奖成功提示
    showClaimSuccessAlert(winningTickets.length, totalPrize);
    
    // 更新界面
    updateAccountDisplay();
    updateStats();
    updateTicketsList();
    // 🔥 更新中奖查询页面显示
    updatePendingTicketsDisplay();
    updateWinningTicketsDisplay();
    
    // 保存数据
    saveData();
}

// 显示兑奖成功提示
function showClaimSuccessAlert(count, amount) {
    const alert = document.createElement('div');
    alert.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #f39c12, #e67e22);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        font-weight: bold;
        box-shadow: 0 10px 30px rgba(243, 156, 18, 0.3);
        z-index: 10001;
        text-align: center;
        animation: claimSuccessAnimation 0.8s ease-out;
    `;
    alert.innerHTML = `
        <h3 style="margin: 0 0 15px 0;">🎉 兑奖成功！</h3>
        <p style="margin: 5px 0;">兑奖彩票：${count}张</p>
        <p style="margin: 5px 0;">获得奖金：¥${amount.toLocaleString()}</p>
        <p style="margin: 5px 0;">恭喜发财！💰</p>
    `;
    
    document.body.appendChild(alert);
    
    // 播放兑奖成功音效
    playClaimSuccessSound();
    
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// 🔥 更新：重定向到新的历史页面更新函数
function updateDrawHistory() {
    try {
        // 检查是否在历史页面，如果是则更新对应的历史列表
        const historyTab = document.getElementById('history');
        if (historyTab && historyTab.classList.contains('active')) {
            // 如果当前在历史页面，更新当前显示的历史类型
            const activeHistoryList = document.querySelector('.history-list.active');
            if (activeHistoryList) {
                const listId = activeHistoryList.id;
                if (listId === 'doubleColorHistory') {
                    loadHistoryData('doubleColor');
                } else if (listId === 'daletoHistory') {
                    loadHistoryData('daletou');
                }
            }
        } else {
            // 如果不在历史页面，静默更新（数据会在用户访问历史页面时显示）

        }
            } catch (error) {

    }
}

// 格式化开奖结果号码
function formatDrawResultNumbers(result) {
    try {
        // 🔥 修复：确保result对象存在且有效
        if (!result || typeof result !== 'object') {

            return '<span class="error-text">数据错误</span>';
        }
        
        if (result.type === 'doubleColor') {
            // 🔥 修复：安全访问双色球数据
            const redNumbers = Array.isArray(result.red) ? result.red : 
                              Array.isArray(result.numbers) ? result.numbers : [];
            const blueNumber = result.blue || result.blueNumber || '?';
            
            if (redNumbers.length === 0) {
                return '<span class="error-text">红球数据缺失</span>';
            }
            
            return `
                ${redNumbers.map(num => `<span class="history-ball red-ball">${num}</span>`).join('')}
                <span class="separator">|</span>
                <span class="history-ball blue-ball">${blueNumber}</span>
            `;
        } else if (result.type === 'daletou') {
            // 🔥 修复：安全访问大乐透数据
            const frontNumbers = Array.isArray(result.front) ? result.front : 
                                Array.isArray(result.frontNumbers) ? result.frontNumbers : [];
            const backNumbers = Array.isArray(result.back) ? result.back : 
                               Array.isArray(result.backNumbers) ? result.backNumbers : [];
            
            if (frontNumbers.length === 0 || backNumbers.length === 0) {
                return '<span class="error-text">号码数据缺失</span>';
            }
            
            return `
                ${frontNumbers.map(num => `<span class="history-ball front-ball">${num}</span>`).join('')}
                <span class="separator">|</span>
                ${backNumbers.map(num => `<span class="history-ball back-ball">${num}</span>`).join('')}
            `;
        } else {
            // 🔥 处理未知类型

            return '<span class="error-text">未知类型</span>';
        }
    } catch (error) {

        return '<span class="error-text">格式化失败</span>';
    }
}

// 音效函数
function playDrawStartSound() {
    audioManager.playSound(200, 0.3, 0.15);
    setTimeout(() => audioManager.playSound(400, 0.3, 0.12), 200);
    setTimeout(() => audioManager.playSound(600, 0.4, 0.1), 400);
}

function playBallAppearSound() {
    audioManager.playSound(400, 0.05, 0.05);
    setTimeout(() => audioManager.playSound(500, 0.05, 0.04), 50);
}

function playDrawCompleteSound() {
    const notes = [523, 659, 784, 1047, 1319, 1568]; // C5-C7
    audioManager.playSequence(notes, 200, 0.15);
}

function playWinningSound() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    audioManager.playSequence(notes, 200, 0.2);
}

function playClaimSuccessSound() {
    audioManager.playSound(1000, 0.1, 0.15);
    setTimeout(() => audioManager.playSound(1200, 0.1, 0.12), 100);
    setTimeout(() => audioManager.playSound(1500, 0.1, 0.1), 200);
    setTimeout(() => audioManager.playSound(2000, 0.2, 0.08), 300);
}
// 在文件末尾添加缺失的音效函数

// 🔥 修复AudioContext自动播放问题
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.userInteracted = false;
        this.pendingSounds = [];
        this.errorCount = 0;
        this.maxErrors = 1; // 🔥 减少错误日志次数
        this.isInitializing = false;
        
        // 🔥 延迟初始化，避免立即创建AudioContext
        this.setupUserInteractionListener();
    }
    
    // 🔥 设置用户交互监听器
    setupUserInteractionListener() {
        if (this.userInteracted) return; // 避免重复设置
        
        const events = ['click', 'touchstart', 'keydown', 'mousedown'];
        let isListening = true;
        
        const handleFirstInteraction = (e) => {
            if (!isListening || this.userInteracted) return;
            
            isListening = false;
            this.userInteracted = true;
            
            // 移除所有事件监听器
            events.forEach(event => {
                document.removeEventListener(event, handleFirstInteraction, true);
            });
            
            // 延迟初始化AudioContext
            setTimeout(() => {
                this.initAudioContext();
            }, 100);
            

        };
        
        // 添加事件监听器
        events.forEach(event => {
            document.addEventListener(event, handleFirstInteraction, true);
        });
        

    }
    
    // 初始化音频上下文
    initAudioContext() {
        if (this.isInitializing || this.audioContext) return;
        
        try {
            this.isInitializing = true;
            
            // 🔥 只在用户交互后创建
            if (!this.userInteracted) {
                this.isInitializing = false;
                return;
            }
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    this.isEnabled = true;
                    this.isInitializing = false;

                    this.playPendingSounds();
                }).catch(error => {
                    this.isInitializing = false;
                    if (this.errorCount < this.maxErrors) {

                        this.errorCount++;
                    }
                });
            } else {
                this.isEnabled = true;
                this.isInitializing = false;
                console.log('🎵 音频上下文创建成功');
                this.playPendingSounds();
            }
        } catch (error) {
            this.isInitializing = false;
            if (this.errorCount < this.maxErrors) {
                console.warn('⚠️ 音频初始化失败:', error);
                this.errorCount++;
            }
            this.isEnabled = false;
        }
    }
    
    // 播放声音
    playSound(frequency, duration = 0.2, volume = 0.1) {
        // 🔥 严格检查条件
        if (!this.userInteracted) {
            // 不记录到待播放队列，直接忽略
            return;
        }
        
        if (!this.isEnabled || !this.audioContext || this.isInitializing) {
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            // 完全静默处理
        }
    }
    
    // 播放待播放的声音
    playPendingSounds() {
        // 清空待播放队列，不播放hover声音
        this.pendingSounds = [];
    }
    
    // 播放音序
    playSequence(notes, interval = 150, volume = 0.1) {
        if (!this.userInteracted) {
            // 不记录到待播放队列，直接忽略
            return;
        }
        
        if (!this.isEnabled || !this.audioContext || this.isInitializing) {
            return;
        }
        
        notes.forEach((frequency, index) => {
            setTimeout(() => {
                this.playSound(frequency, 0.2, volume);
            }, index * interval);
        });
    }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager();

// 🔥 确保在DOM加载完成后再进行任何音频相关操作
document.addEventListener('DOMContentLoaded', function() {
    // 延迟一些时间确保所有模块都加载完成
    setTimeout(() => {
        console.log('🎵 音频系统准备就绪，等待用户交互...');
    }, 500);
});

// 开奖类型切换函数
function switchDrawType(type) {
    currentDrawType = type;
    
    try {
        document.querySelectorAll('#draw .lottery-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const targetBtn = document.querySelector(`[onclick*="switchDrawType('${type}')"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    } catch (error) {
        console.warn('开奖类型按钮更新失败:', error);
    }
    
    updateDrawTitle();
    updatePrizeTable();
    
    if (statusIndicator) {
        statusIndicator.show(`切换到${type === 'doubleColor' ? '双色球' : '大乐透'}开奖`, 'info', 1500);
    }
}

// 更新开奖标题
function updateDrawTitle() {
    const drawTitle = document.getElementById('drawTitle');
    if (drawTitle) {
        drawTitle.textContent = currentDrawType === 'doubleColor' ? '双色球摇奖中...' : '大乐透摇奖中...';
    }
}

// 修复getCurrentPeriod函数，确保支持大乐透
function getCurrentPeriod(type = currentDrawType) {
    const now = new Date();
    const year = now.getFullYear();
    const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / (1000 * 60 * 60 * 24));
    
    if (type === 'doubleColor') {
        // 双色球：每周二、四、日开奖，一年约150期
        return `${year}${String(Math.floor(dayOfYear / 2.4) + 1).padStart(3, '0')}`;
    } else {
        // 大乐透：每周一、三、六开奖，一年约150期
        return `${year}${String(Math.floor(dayOfYear / 2.4) + 1).padStart(3, '0')}`;
    }
}

// 🔥 为现有的音频函数添加用户交互检查
function playRandomSelectSound() {
    const notes = [523, 659, 784, 1047];
    audioManager.playSequence(notes, 100, 0.1);
}

function playQuantitySetSound() {
    audioManager.playSound(800, 0.1, 0.1);
    setTimeout(() => audioManager.playSound(1000, 0.1, 0.08), 100);
}

function playQuantityAdjustSound() {
    audioManager.playSound(600, 0.1, 0.1);
}

function playSelectSound() {
    audioManager.playSound(800, 0.1, 0.1);
}

function playDeselectSound() {
    audioManager.playSound(400, 0.1, 0.1);
}

function playLimitSound() {
    audioManager.playSound(300, 0.1, 0.15);
    setTimeout(() => audioManager.playSound(250, 0.1, 0.12), 100);
}

function playBallConfirmSound() {
    audioManager.playSound(1000, 0.1, 0.1);
    setTimeout(() => audioManager.playSound(1200, 0.1, 0.08), 100);
}

function playRandomCompleteSound() {
    const notes = [523, 659, 784, 1047];
    audioManager.playSequence(notes, 150, 0.12);
}

function playBetSuccessSound() {
    const notes = [523, 659, 784];
    audioManager.playSequence(notes, 150, 0.15);
}

// playRandomTickSound() 函数已在上方定义，这里删除重复的

// 🔇 重写所有可能触发AudioContext的hover函数
// 🔊 全局hover音效已移动到InteractionEnhancer类中，移除此禁用函数

// 🔊 启用InteractionEnhancer类中的playHoverSound方法
// 移除之前的禁用代码，使用类内部的实现

// 错误处理
window.addEventListener('error', function(e) {
    if (e.error === null || 
        (e.message && e.message.includes('audio device')) ||
        (e.message && e.message.includes('WebAudio renderer'))) {
        return;
    }
    
    console.error('JavaScript错误:', e.error);
    console.error('错误位置:', e.filename, '行号:', e.lineno);
    
    if (typeof statusIndicator !== 'undefined' && statusIndicator) {
        statusIndicator.show('系统出现错误，正在尝试恢复...', 'error', 3000);
    }
});

// Promise错误处理
window.addEventListener('unhandledrejection', function(e) {
    console.error('未处理的Promise错误:', e.reason);
    e.preventDefault();
    
    if (typeof statusIndicator !== 'undefined' && statusIndicator) {
        statusIndicator.show('系统异步操作出错，请重试', 'warning', 3000);
    }
});



// 🎉 庆祝动画管理器
class CelebrationManager {
    constructor() {
        this.activeCelebrations = new Set();
    }
    
    // 🎊 触发中奖庆祝动画
    triggerLotteryCelebration(prizeLevel, prizeAmount, lotteryType) {
        // 根据奖级决定庆祝强度
        if (prizeLevel <= 3) {
            // 1-3等奖：超级庆祝
            this.createMegaCelebration(prizeLevel, prizeAmount, lotteryType);
        } else if (prizeLevel <= 6) {
            // 4-6等奖：中等庆祝
            this.createModerateWin(prizeLevel, prizeAmount);
        } else {
            // 小奖：简单庆祝
            this.createSimpleCelebration();
        }
        
        // 播放庆祝音效
        this.playCelebrationSound(prizeLevel);
    }
    
    // 🎆 超级庆祝（1-3等奖）
    createMegaCelebration(prizeLevel, prizeAmount, lotteryType) {
        // 创建庆祝覆盖层
        const overlay = this.createCelebrationOverlay();
        
        // 大奖文字
        const winText = document.createElement('div');
        winText.className = 'big-win-text';
        winText.innerHTML = `
            🎊 恭喜中${prizeLevel}等奖！🎊<br>
            <span style="font-size: 0.7em;">¥${prizeAmount.toLocaleString()}</span>
        `;
        overlay.appendChild(winText);
        
        // 彩虹横幅
        const banner = document.createElement('div');
        banner.className = 'celebration-banner';
        banner.textContent = `🏆 ${lotteryType === 'doubleColor' ? '双色球' : '大乐透'}超级大奖！🏆`;
        overlay.appendChild(banner);
        
        // 撒花效果
        this.createConfetti(overlay, 100);
        
        // 鞭炮效果
        this.createFireworks(overlay, 20);
        
        // 金币雨
        this.createCoinRain(overlay, 50);
        
        // 8秒后自动清理
        setTimeout(() => {
            this.removeCelebration(overlay);
        }, 8000);
    }
    
    // 🎈 中等庆祝（4-6等奖）
    createModerateWin(prizeLevel, prizeAmount) {
        const overlay = this.createCelebrationOverlay();
        
        const winText = document.createElement('div');
        winText.className = 'big-win-text';
        winText.style.fontSize = '3rem';
        winText.innerHTML = `
            🎉 恭喜中${prizeLevel}等奖！🎉<br>
            <span style="font-size: 0.7em;">¥${prizeAmount.toLocaleString()}</span>
        `;
        overlay.appendChild(winText);
        
        // 适量撒花
        this.createConfetti(overlay, 50);
        
        // 少量鞭炮
        this.createFireworks(overlay, 8);
        
        // 5秒后清理
        setTimeout(() => {
            this.removeCelebration(overlay);
        }, 5000);
    }
    
    // 🎁 简单庆祝（小奖）
    createSimpleCelebration() {
        const overlay = this.createCelebrationOverlay();
        
        const winText = document.createElement('div');
        winText.className = 'big-win-text';
        winText.style.fontSize = '2.5rem';
        winText.textContent = '🎉 恭喜中奖！🎉';
        overlay.appendChild(winText);
        
        // 少量撒花
        this.createConfetti(overlay, 20);
        
        // 3秒后清理
        setTimeout(() => {
            this.removeCelebration(overlay);
        }, 3000);
    }
    
    // 🎯 转盘大奖庆祝
    triggerWheelCelebration(winAmount) {
        const wheelContainer = document.querySelector('#wheelModal .wheel-container');
        if (!wheelContainer) return;
        
        // 添加转盘特效
        const effect = document.createElement('div');
        effect.className = 'wheel-jackpot-effect';
        wheelContainer.appendChild(effect);
        
        // 创建全屏庆祝
        const overlay = this.createCelebrationOverlay();
        
        const winText = document.createElement('div');
        winText.className = 'big-win-text';
        winText.innerHTML = `
            🎰 转盘大奖！🎰<br>
            <span style="font-size: 0.7em;">¥${winAmount.toLocaleString()}</span>
        `;
        overlay.appendChild(winText);
        
        // 金币雨效果
        this.createCoinRain(overlay, 80);
        
        // 鞭炮效果
        this.createFireworks(overlay, 15);
        
        // 播放特殊音效
        this.playWheelJackpotSound();
        
        // 6秒后清理
        setTimeout(() => {
            this.removeCelebration(overlay);
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 6000);
    }
    
    // 创建庆祝覆盖层
    createCelebrationOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay';
        document.body.appendChild(overlay);
        this.activeCelebrations.add(overlay);
        return overlay;
    }
    
    // 🚀 性能优化：创建撒花效果（批量处理）
    createConfetti(container, count) {
        const fragment = document.createDocumentFragment();
        const batchSize = 20;
        let created = 0;
        
        const createBatch = () => {
            const currentBatch = Math.min(batchSize, count - created);
            
            for (let i = 0; i < currentBatch; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.animationDelay = Math.random() * 3 + 's';
                confetti.style.animationDuration = (Math.random() * 1 + 2) + 's';
                fragment.appendChild(confetti);
                created++;
            }
            
            if (created < count) {
                requestAnimationFrame(createBatch);
            } else {
                container.appendChild(fragment);
            }
        };
        
        createBatch();
    }
    
    // 创建鞭炮效果
    createFireworks(container, count) {
        const colors = ['red', 'blue', 'gold', 'green', 'purple'];
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = `firework ${colors[Math.floor(Math.random() * colors.length)]}`;
                firework.style.left = (Math.random() * 80 + 10) + '%';
                firework.style.top = (Math.random() * 60 + 20) + '%';
                container.appendChild(firework);
                
                // 1秒后移除
                setTimeout(() => {
                    if (firework.parentNode) {
                        firework.parentNode.removeChild(firework);
                    }
                }, 1000);
            }, Math.random() * 2000);
        }
    }
    
    // 🚀 性能优化：创建金币雨（批量处理 + requestAnimationFrame）
    createCoinRain(container, count) {
        const fragment = document.createDocumentFragment();
        const batchSize = 15;
        let created = 0;
        
        const createBatch = () => {
            const currentBatch = Math.min(batchSize, count - created);
            
            for (let i = 0; i < currentBatch; i++) {
                const coin = document.createElement('div');
                coin.className = 'coin';
                coin.style.left = Math.random() * 100 + '%';
                coin.style.animationDelay = Math.random() * 1 + 's';
                fragment.appendChild(coin);
                created++;
            }
            
            if (created < count) {
                // 延迟创建下一批，避免一次性创建太多
                setTimeout(() => requestAnimationFrame(createBatch), Math.random() * 200);
            } else {
                container.appendChild(fragment);
            }
        };
        
        createBatch();
    }
    
    // 播放庆祝音效
    playCelebrationSound(prizeLevel) {
        try {
            if (typeof audioManager !== 'undefined' && audioManager.userInteracted) {
                if (prizeLevel <= 3) {
                    // 大奖音效：连续上升音调
                    this.playJackpotSound();
                } else {
                    // 小奖音效：欢快音调
                    this.playWinSound();
                }
            }
        } catch (error) {
            // 忽略音效播放错误
        }
    }
    
    // 大奖音效
    playJackpotSound() {
        const notes = [523, 659, 784, 1047, 1319]; // C-E-G-C-E 音阶
        notes.forEach((freq, index) => {
            setTimeout(() => {
                audioManager.playSound(freq, 0.3, 0.4);
            }, index * 200);
        });
    }
    
    // 中奖音效
    playWinSound() {
        const melody = [659, 784, 880, 1047]; // E-G-A-C
        melody.forEach((freq, index) => {
            setTimeout(() => {
                audioManager.playSound(freq, 0.2, 0.3);
            }, index * 150);
        });
    }
    
    // 转盘大奖音效
    playWheelJackpotSound() {
        // 播放特殊的转盘获胜音效
        const spinWinMelody = [440, 554, 659, 880, 1109, 1319]; // A-C#-E-A-C#-E
        spinWinMelody.forEach((freq, index) => {
            setTimeout(() => {
                audioManager.playSound(freq, 0.25, 0.35);
            }, index * 180);
        });
    }
    
    // 移除庆祝效果
    removeCelebration(overlay) {
        if (overlay && overlay.parentNode) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.activeCelebrations.delete(overlay);
            }, 500);
        }
    }
    
    // 清理所有庆祝效果
    clearAllCelebrations() {
        this.activeCelebrations.forEach(overlay => {
            this.removeCelebration(overlay);
        });
    }
}

// 创建全局庆祝管理器实例
const celebrationManager = new CelebrationManager();

// 系统初始化完成

// 防沉迷相关功能
function showResponsibleGamingModal() {
    const modal = document.createElement('div');
    modal.className = 'responsibility-modal';
    modal.innerHTML = `
        <div class="responsibility-modal-content">
            <button class="close-btn" onclick="closeResponsibilityModal()">&times;</button>
            <h2>🎯 负责任博彩</h2>
            <div class="responsibility-content">
                <h3>理性购彩原则：</h3>
                <ul>
                    <li>购彩应当是一种娱乐方式，而非投资手段</li>
                    <li>只用闲余资金购彩，不影响正常生活</li>
                    <li>设定购彩预算，严格控制支出</li>
                    <li>不要试图通过购彩解决经济问题</li>
                </ul>
                
                <h3>防沉迷提醒：</h3>
                <ul>
                    <li>合理安排购彩时间，避免过度沉迷</li>
                    <li>如发现购彩行为失控，请及时寻求帮助</li>
                    <li>未成年人严禁参与任何形式的博彩活动</li>
                </ul>
                
                <h3>寻求帮助：</h3>
                <p>如果您或您身边的人需要帮助，请联系：</p>
                <p><strong>全国戒赌热线：400-818-1818</strong></p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showHelpModal() {
    const modal = document.createElement('div');
    modal.className = 'responsibility-modal';
    modal.innerHTML = `
        <div class="responsibility-modal-content">
            <button class="close-btn" onclick="closeResponsibilityModal()">&times;</button>
            <h2>📞 帮助中心</h2>
            <div class="responsibility-content">
                <h3>系统使用说明：</h3>
                <ul>
                    <li>本系统为彩票模拟演示，不涉及真实资金</li>
                    <li>支持双色球和大乐透两种彩票类型</li>
                    <li>可进行手动选号或机选号码</li>
                    <li>提供开奖模拟和中奖检测功能</li>
                </ul>
                
                <h3>常见问题：</h3>
                <ul>
                    <li><strong>Q：</strong>这是真实的彩票系统吗？</li>
                    <li><strong>A：</strong>不是，这只是一个技术演示项目</li>
                    <li><strong>Q：</strong>可以用真钱购买吗？</li>
                    <li><strong>A：</strong>不可以，系统中的所有金额都是虚拟的</li>
                </ul>
                
                <h3>技术支持：</h3>
                <p>如有技术问题，请联系开发团队</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function showDisclaimerModal() {
    const modal = document.createElement('div');
    modal.className = 'responsibility-modal';
    modal.innerHTML = `
        <div class="responsibility-modal-content">
            <button class="close-btn" onclick="closeResponsibilityModal()">&times;</button>
            <h2>📋 免责声明</h2>
            <div class="responsibility-content">
                <h3>重要声明：</h3>
                <ul>
                    <li>本系统为技术演示项目，仅供学习和研究使用</li>
                    <li>与任何官方彩票机构无关联关系</li>
                    <li>系统中的所有数据、金额均为虚拟模拟</li>
                    <li>不提供任何形式的真实彩票购买服务</li>
                </ul>
                
                <h3>使用条款：</h3>
                <ul>
                    <li>用户使用本系统即表示同意本声明</li>
                    <li>禁止将本系统用于任何商业用途</li>
                    <li>禁止修改系统进行非法活动</li>
                    <li>开发者不承担任何使用风险</li>
                </ul>
                
                <h3>法律责任：</h3>
                <p>用户应遵守当地法律法规，理性对待彩票购买行为。</p>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeResponsibilityModal() {
    const modal = document.querySelector('.responsibility-modal');
    if (modal) {
        modal.remove();
    }
}




