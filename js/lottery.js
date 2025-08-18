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
function createBallGrid(containerId, count, ballClass, clickHandler) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const ball = document.createElement('div');
        ball.className = `ball ${ballClass}`;
        ball.textContent = i.toString().padStart(2, '0');
        ball.dataset.number = i;
        ball.onclick = () => clickHandler(ball, i);
        container.appendChild(ball);
    }
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
function randomSelect() {
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

// 优化的数量控制函数
function validateAndUpdateQuantity(value) {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 1) {
        document.getElementById('betQuantity').value = 1;
        betQuantity = 1;
    } else if (numValue > 20) {
        document.getElementById('betQuantity').value = 20;
        betQuantity = 20;
        showQuantityAlert('最多投注20注！');
    } else {
        betQuantity = numValue;
    }
    updateCostDisplay();
}

function updateQuantityFromInput() {
    const input = document.getElementById('betQuantity');
    const value = parseInt(input.value);
    
    if (isNaN(value) || value < 1) {
        input.value = 1;
        betQuantity = 1;
        showQuantityAlert('最少投注1注！');
    } else if (value > 20) {
        input.value = 20;
        betQuantity = 20;
        showQuantityAlert('最多投注20注！');
    } else {
        betQuantity = value;
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
    
    // 移除投注上限，只保留最低为1的限制
    if (newValue >= 1) {
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
            console.log('按钮高亮失败:', error);
        }
    }, 10);
}

function updateCostDisplay() {
    const totalCost = betQuantity * ticketPrice;
    const costElement = document.getElementById('totalCost');
    if (costElement) {
        costElement.textContent = totalCost;
        
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
    accountBalance -= ticketData.totalCost;
    
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
    
    showBetSuccessAlert(ticketData);
    updateAccountDisplay();
    updateStatsDisplay();
    updateTicketsList();
    clearSelection();
    saveData();
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
            console.log('标签按钮激活失败:', btnError);
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
        console.error('切换标签页错误:', error);
        if (statusIndicator) {
            statusIndicator.show('页面切换失败', 'error', 2000);
        }
    }
}

// 更新导航指示器 - 阴影跟随效果
function updateNavIndicator(tabName) {
    const tabs = ['selection', 'draw', 'check', 'account'];
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
function getCurrentPeriod(type) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const typePrefix = type === 'doubleColor' ? 'SSQ' : 'DLT';
    return `${typePrefix}${year}${month}${date}`;
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
        const balanceElement = safeGetElement('accountBalance');
        if (balanceElement) {
            balanceElement.textContent = `¥ ${accountBalance.toFixed(2)}`;
        }
    } catch (error) {
        console.error('更新账户显示错误:', error);
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
        console.error('更新统计信息错误:', error);
    }
}

// 添加updateStats函数的别名以保持兼容性
function updateStats() {
    updateStatsDisplay();
}

// 更新投注单列表
function updateTicketsList() {
    try {
        const container = safeGetElement('ticketsList');
        if (!container) return;
        
        if (userTickets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无投注记录</p>';
            return;
        }
        
        container.innerHTML = userTickets.slice(-10).reverse().map(ticket => `
            <div class="ticket-item ${ticket.status}">
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
            </div>
        `).join('');
    } catch (error) {
        console.error('更新投注单列表错误:', error);
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
        localStorage.setItem('lotteryUserTickets', JSON.stringify(userTickets));
        localStorage.setItem('lotteryAccountBalance', accountBalance.toString());
        localStorage.setItem('lotteryStats', JSON.stringify(stats));
        localStorage.setItem('lotteryDrawResults', JSON.stringify(drawResults));
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 加载数据
function loadData() {
    try {
        const savedTickets = localStorage.getItem('lotteryUserTickets');
        if (savedTickets) {
            userTickets = JSON.parse(savedTickets);
        }
        
        const savedBalance = localStorage.getItem('lotteryAccountBalance');
        if (savedBalance) {
            accountBalance = parseFloat(savedBalance);
        }
        
        const savedStats = localStorage.getItem('lotteryStats');
        if (savedStats) {
            stats = JSON.parse(savedStats);
        }
        
        const savedDrawResults = localStorage.getItem('lotteryDrawResults');
        if (savedDrawResults) {
            drawResults = JSON.parse(savedDrawResults);
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
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
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(startFreq, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
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
        this.setupHoverEffects();
        this.setupClickEffects();
        this.setupKeyboardShortcuts();
        this.setupGestureSupport();
    }
    
    setupHoverEffects() {
        // 为所有球添加悬浮音效和视觉反馈
        document.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('ball')) {
                this.playHoverSound();
                e.target.style.transform = 'scale(1.1)';
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('ball')) {
                e.target.style.transform = '';
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
    
    playHoverSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.02, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
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
            console.log(`页面加载时间: ${loadTime.toFixed(2)}ms`);
            
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
                    console.warn('内存使用过高:', memory.usedJSHeapSize / 1024 / 1024, 'MB');
                }
            }, 30000);
        }
        
        // 监控长任务
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.duration > 50) {
                        console.warn('检测到长任务:', entry.duration, 'ms');
                    }
                }
            });
            observer.observe({ entryTypes: ['longtask'] });
        }
    }
    
    setupErrorHandling() {
        // 全局错误处理
        window.addEventListener('error', (e) => {
            console.error('JavaScript错误:', e.error);
            statusIndicator.show('系统出现错误，请刷新页面重试', 'error', 5000);
        });
        
        // Promise错误处理
        window.addEventListener('unhandledrejection', (e) => {
            console.error('未处理的Promise错误:', e.reason);
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
                
                console.log('性能指标:', metrics);
            }
        }
    }
    
    measureFunction(fn, name) {
        return function(...args) {
            const start = performance.now();
            const result = fn.apply(this, args);
            const end = performance.now();
            console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
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
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
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
            console.warn('尝试调用非函数:', fn);
            return null;
        }
    } catch (error) {
        console.error('函数调用错误:', error);
        console.error('错误堆栈:', error.stack);
        if (typeof statusIndicator !== 'undefined' && statusIndicator && statusIndicator.show) {
            statusIndicator.show('操作失败，请重试', 'error', 2000);
        }
        return null;
    }
}

// 安全的DOM元素获取
function safeGetElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`DOM元素未找到: ${id}`);
    }
    return element;
}

// 修复初始化函数
function initializeSystemSafely() {
    // 确保所有必要的DOM元素存在
    const requiredElements = [
        'redBallGrid', 'blueBallGrid', 'frontBallGrid', 'backBallGrid',
        'selectedRedBalls', 'selectedBlueBalls', 'selectedFrontBalls', 'selectedBackBalls',
        'betQuantity', 'totalCost'
    ];
    
    const missingElements = requiredElements.filter(id => !document.getElementById(id));
    if (missingElements.length > 0) {
        console.warn('缺少部分DOM元素:', missingElements);
        console.log('系统将尝试继续初始化...');
    }
    
    // 安全初始化
    try {
        console.log('开始系统初始化...');
        
        safeCall(initializeBalls);
        console.log('球体初始化完成');
        
        safeCall(updatePrizeTable);
        console.log('奖金表更新完成');
        
        safeCall(updateStatsDisplay);
        console.log('统计信息更新完成');
        
        safeCall(updateAccountDisplay);
        console.log('账户显示更新完成');
        
        safeCall(updateTicketsList);
        console.log('投注单列表更新完成');
        
        safeCall(updateDrawHistory);
        console.log('开奖历史更新完成');
        
        safeCall(startCountdown);
        console.log('倒计时启动完成');
        
        console.log('系统初始化成功');
        return true;
    } catch (error) {
        console.error('系统初始化失败:', error);
        console.error('错误堆栈:', error.stack);
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
    `;
    document.head.appendChild(style);
}

// 页面初始化完成
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面DOM加载完成');
    
    // 添加摇晃动画
    addShakeAnimation();
    
    // 加载保存的数据
    safeCall(loadData);
    
    // 创建页面加载器
    try {
        new PageLoader();
    } catch (error) {
        console.error('页面加载器创建失败:', error);
    }
    
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
                
                // 显示欢迎消息
                setTimeout(() => {
                    if (statusIndicator) {
                        statusIndicator.show('🎉 彩票系统加载完成！', 'success', 3000);
                    }
                }, 1000);
            } else {
                console.error('彩票系统初始化失败');
                if (statusIndicator) {
                    statusIndicator.show('系统初始化失败，请刷新页面', 'error', 5000);
                }
            }
            
        } catch (error) {
            console.error('组件初始化错误:', error);
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
                
                // 最后10秒时添加紧急提示
                if (diff <= 10000) {
                    countdownElement.style.animation = 'urgentBlink 0.5s infinite';
                    countdownElement.style.color = '#e74c3c';
                } else {
                    countdownElement.style.animation = '';
                    countdownElement.style.color = '';
                }
            } else {
                countdownElement.innerHTML = `
                    <div class="draw-ready">🎰 开奖时间到！可以进行开奖了！</div>
                `;
            }
        } catch (error) {
            console.error('更新倒计时错误:', error);
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
    `;
    document.head.appendChild(style);
}
// 在文件末尾添加缺失的函数定义

// 开奖系统函数
function startDraw() {
    const drawBtn = document.querySelector('.btn-draw');
    if (drawBtn) {
        drawBtn.disabled = true;
        drawBtn.textContent = '🎰 摇奖进行中...';
    }
    
    // 播放开奖前音效
    playDrawStartSound();
    
    // 显示摇奖机动画
    showDrawMachine();
    
    // 开始真实的摇奖过程
    if (currentDrawType === 'doubleColor') {
        performDoubleColorDraw();
    } else {
        performDaletouDraw();
    }
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

// 执行双色球开奖
function performDoubleColorDraw() {
    // 第一阶段：显示旋转的球
    showSpinningBalls('doubleColor');
    
    // 第二阶段：逐个确定红球（6秒）
    setTimeout(() => {
        drawRedBalls();
    }, 2000);
    
    // 第三阶段：确定蓝球（2秒后）
    setTimeout(() => {
        drawBlueBall();
    }, 8000);
    
    // 第四阶段：显示最终结果
    setTimeout(() => {
        showFinalDrawResults();
    }, 10000);
}

// 执行大乐透开奖
function performDaletouDraw() {
    // 第一阶段：显示旋转的球
    showSpinningBalls('daletou');
    
    // 第二阶段：逐个确定前区球（7秒）
    setTimeout(() => {
        drawFrontBalls();
    }, 2000);
    
    // 第三阶段：确定后区球（2秒后）
    setTimeout(() => {
        drawBackBalls();
    }, 9000);
    
    // 第四阶段：显示最终结果
    setTimeout(() => {
        showFinalDrawResults();
    }, 12000);
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
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🔴 正在摇出红球...';
    
    const redNumbers = generateRandomNumbers(33, 6);
    
    // 存储当前开奖结果
    if (!window.currentDrawResult) {
        window.currentDrawResult = {};
    }
    window.currentDrawResult.red = redNumbers;
    
    redNumbers.forEach((num, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'final-ball';
            ball.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            ball.style.cssText += `
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: ballAppear 0.8s ease-out;
            `;
            ball.textContent = num;
            finalResults.appendChild(ball);
            
            // 播放球确定音效
            playBallConfirmSound();
            
            // 更新摇奖机显示
            if (index === redNumbers.length - 1) {
                chamberLabel.textContent = '🔴 红球摇奖完成！';
            }
        }, index * 800);
    });
}

// 摇出蓝球
function drawBlueBall() {
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🔵 正在摇出蓝球...';
    
    const blueNumber = Math.floor(Math.random() * 16) + 1;
    window.currentDrawResult.blue = blueNumber;
    
    setTimeout(() => {
        // 添加分隔符
        const separator = document.createElement('div');
        separator.className = 'separator';
        separator.textContent = '|';
        separator.style.cssText = `
            font-size: 2em;
            color: white;
            margin: 0 10px;
            font-weight: bold;
        `;
        finalResults.appendChild(separator);
        
        // 添加蓝球
        const ball = document.createElement('div');
        ball.className = 'final-ball';
        ball.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
        ball.style.cssText += `
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 1.1em;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            animation: ballAppear 0.8s ease-out;
        `;
        ball.textContent = blueNumber;
        finalResults.appendChild(ball);
        
        // 播放蓝球确定音效
        playBallConfirmSound();
        
        chamberLabel.textContent = '🔵 蓝球摇奖完成！';
    }, 500);
}

// 摇出前区球
function drawFrontBalls() {
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🟡 正在摇出前区球...';
    
    const frontNumbers = generateRandomNumbers(35, 5);
    
    if (!window.currentDrawResult) {
        window.currentDrawResult = {};
    }
    window.currentDrawResult.front = frontNumbers;
    
    frontNumbers.forEach((num, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'final-ball';
            ball.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
            ball.style.cssText += `
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: ballAppear 0.8s ease-out;
            `;
            ball.textContent = num;
            finalResults.appendChild(ball);
            
            playBallConfirmSound();
            
            if (index === frontNumbers.length - 1) {
                chamberLabel.textContent = '🟡 前区摇奖完成！';
            }
        }, index * 700);
    });
}

// 摇出后区球
function drawBackBalls() {
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🟣 正在摇出后区球...';
    
    const backNumbers = generateRandomNumbers(12, 2);
    window.currentDrawResult.back = backNumbers;
    
    // 添加分隔符
    setTimeout(() => {
        const separator = document.createElement('div');
        separator.className = 'separator';
        separator.textContent = '|';
        separator.style.cssText = `
            font-size: 2em;
            color: white;
            margin: 0 10px;
            font-weight: bold;
        `;
        finalResults.appendChild(separator);
    }, 200);
    
    backNumbers.forEach((num, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'final-ball';
            ball.style.background = 'linear-gradient(45deg, #9b59b6, #8e44ad)';
            ball.style.cssText += `
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: ballAppear 0.8s ease-out;
            `;
            ball.textContent = num;
            finalResults.appendChild(ball);
            
            playBallConfirmSound();
            
            if (index === backNumbers.length - 1) {
                chamberLabel.textContent = '🟣 后区摇奖完成！';
            }
        }, 500 + index * 800);
    });
}

// 显示最终开奖结果
function showFinalDrawResults() {
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
}

// 显示庆祝动画
function showCelebrationAnimation() {
    // 创建彩带效果
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createConfetti();
        }, i * 100);
    }
}

// 创建彩带
function createConfetti() {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: 10px;
        height: 10px;
        background: ${getRandomBallColor()};
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        animation: confettiFall 3s linear forwards;
    `;
    
    document.body.appendChild(confetti);
    
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
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        confetti.remove();
    }, 3000);
}

// 更新奖金表
function updatePrizeTable() {
    const tbody = document.getElementById('prizeTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const config = prizeConfig[currentDrawType];
    const levels = {};
    
    // 按奖级分组
    Object.keys(config).forEach(key => {
        const prize = config[key];
        if (!levels[prize.level]) {
            levels[prize.level] = {
                name: prize.name,
                conditions: [],
                amount: prize.amount
            };
        }
        levels[prize.level].conditions.push(key);
    });
    
    // 按奖级排序并显示
    Object.keys(levels).sort((a, b) => a - b).forEach(level => {
        const prize = levels[level];
        const row = document.createElement('tr');
        
        // 格式化中奖条件
        const conditions = prize.conditions.map(condition => {
            const [main, special] = condition.split('-');
            if (currentDrawType === 'doubleColor') {
                return `${main}红+${special}蓝`;
            } else {
                return `${main}前+${special}后`;
            }
        }).join(' 或 ');
        
        row.innerHTML = `
            <td>${prize.name}</td>
            <td>${conditions}</td>
            <td>¥${prize.amount.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// 检查所有彩票中奖情况
function checkAllTickets() {
    const resultsContainer = document.getElementById('winningResults');
    if (!resultsContainer) return;
    
    const groupedTickets = {};
    userTickets.forEach(ticket => {
        const key = `${ticket.lotteryType}-${ticket.period}`;
        if (!groupedTickets[key]) {
            groupedTickets[key] = [];
        }
        groupedTickets[key].push(ticket);
    });
    
    if (Object.keys(groupedTickets).length === 0) {
        resultsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无投注记录</p>';
        return;
    }
    
    resultsContainer.innerHTML = Object.keys(groupedTickets).map(key => {
        const tickets = groupedTickets[key];
        const [type, period] = key.split('-');
        const winningTickets = tickets.filter(t => t.status === 'won' || t.status === 'claimed');
        const totalPrize = winningTickets.reduce((sum, t) => sum + (t.prizeAmount || 0), 0);
        
        return `
            <div class="check-result-item ${winningTickets.length > 0 ? 'has-winning' : ''}">
                <div class="result-header">
                    <h4>${type === 'doubleColor' ? '双色球' : '大乐透'} - 期号: ${period}</h4>
                    <div class="result-summary">
                        投注 ${tickets.length} 张，中奖 ${winningTickets.length} 张
                        ${totalPrize > 0 ? `，总奖金 ¥${totalPrize.toLocaleString()}` : ''}
                    </div>
                </div>
                <div class="tickets-detail">
                    ${tickets.map(ticket => `
                        <div class="ticket-check-item ${ticket.status}">
                            <div class="ticket-numbers">${formatTicketNumbers(ticket)}</div>
                            <div class="ticket-result">
                                ${ticket.status === 'won' ? `${ticket.prizeName} ¥${ticket.prizeAmount.toLocaleString()}` : 
                                  ticket.status === 'claimed' ? `已兑奖 ¥${ticket.prizeAmount.toLocaleString()}` : 
                                  ticket.status === 'lost' ? '未中奖' : '等待开奖'}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

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

// 更新开奖历史
function updateDrawHistory() {
    try {
        const historyContainer = safeGetElement('drawHistory');
        if (!historyContainer) return;
        
        const allResults = [...drawResults.doubleColor, ...drawResults.daletou]
            .sort((a, b) => new Date(b.drawTime) - new Date(a.drawTime))
            .slice(0, 10);
        
        if (allResults.length === 0) {
            historyContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">暂无开奖记录</p>';
            return;
        }
        
        historyContainer.innerHTML = allResults.map(result => `
            <div class="history-item">
                <div class="history-header">
                    <span class="lottery-type">${result.type === 'doubleColor' ? '双色球' : '大乐透'}</span>
                    <span class="draw-period">期号: ${result.period}</span>
                </div>
                <div class="history-numbers">
                    ${formatDrawResultNumbers(result)}
                </div>
                <div class="draw-time">开奖时间: ${result.drawTime}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('更新开奖历史错误:', error);
    }
}

// 格式化开奖结果号码
function formatDrawResultNumbers(result) {
    if (result.type === 'doubleColor') {
        return `
            ${result.red.map(num => `<span class="history-ball red-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            <span class="history-ball blue-ball">${result.blue}</span>
        `;
    } else {
        return `
            ${result.front.map(num => `<span class="history-ball front-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            ${result.back.map(num => `<span class="history-ball back-ball">${num}</span>`).join('')}
        `;
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

// 音频管理器 - 统一管理音频上下文
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = true;
        this.initAudioContext();
    }
    
    initAudioContext() {
        try {
            // 检查浏览器支持
            if (typeof AudioContext !== 'undefined') {
                this.audioContext = new AudioContext();
            } else if (typeof webkitAudioContext !== 'undefined') {
                this.audioContext = new webkitAudioContext();
            } else {
                console.warn('浏览器不支持 Web Audio API');
                this.isEnabled = false;
                return;
            }
            
            // 处理音频上下文状态
            if (this.audioContext.state === 'suspended') {
                // 等待用户交互后恢复音频上下文
                document.addEventListener('click', () => {
                    if (this.audioContext.state === 'suspended') {
                        this.audioContext.resume().catch(err => {
                            console.log('音频上下文恢复失败:', err);
                        });
                    }
                }, { once: true });
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

// 修复updatePrizeTable函数，确保正确显示大乐透奖金
function updatePrizeTable() {
    const tbody = document.getElementById('prizeTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const config = prizeConfig[currentDrawType];
    if (!config) {
        console.error('未找到奖金配置:', currentDrawType);
        return;
    }
    
    const levels = {};
    
    // 按奖级分组
    Object.keys(config).forEach(key => {
        const prize = config[key];
        if (!levels[prize.level]) {
            levels[prize.level] = {
                name: prize.name,
                conditions: [],
                amount: prize.amount
            };
        }
        levels[prize.level].conditions.push(key);
    });
    
    // 按奖级排序并显示
    Object.keys(levels).sort((a, b) => a - b).forEach(level => {
        const prize = levels[level];
        const row = document.createElement('tr');
        
        // 格式化中奖条件
        const conditions = prize.conditions.map(condition => {
            const [main, special] = condition.split('-');
            if (currentDrawType === 'doubleColor') {
                return `${main}红+${special}蓝`;
            } else {
                return `${main}前+${special}后`;
            }
        }).join(' 或 ');
        
        row.innerHTML = `
            <td>${prize.name}</td>
            <td>${conditions}</td>
            <td>¥${prize.amount.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}

// 修复drawFrontBalls函数（大乐透前区开奖）
function drawFrontBalls() {
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🟡 正在摇出前区球...';
    
    const frontNumbers = generateRandomNumbers(35, 5);
    
    if (!window.currentDrawResult) {
        window.currentDrawResult = {};
    }
    window.currentDrawResult.front = frontNumbers;
    
    frontNumbers.forEach((num, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'final-ball';
            ball.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
            ball.style.cssText += `
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: ballAppear 0.8s ease-out;
            `;
            ball.textContent = num;
            finalResults.appendChild(ball);
            
            playBallConfirmSound();
            
            if (index === frontNumbers.length - 1) {
                chamberLabel.textContent = '🟡 前区摇奖完成！';
            }
        }, index * 700);
    });
}

// 修复drawBackBalls函数（大乐透后区开奖）
function drawBackBalls() {
    const chamberLabel = document.querySelector('.chamber-label');
    const finalResults = document.getElementById('finalResults');
    
    if (!chamberLabel || !finalResults) return;
    
    chamberLabel.textContent = '🟣 正在摇出后区球...';
    
    const backNumbers = generateRandomNumbers(12, 2);
    window.currentDrawResult.back = backNumbers;
    
    // 添加分隔符
    setTimeout(() => {
        const separator = document.createElement('div');
        separator.className = 'separator';
        separator.textContent = '|';
        separator.style.cssText = `
            font-size: 2em;
            color: white;
            margin: 0 10px;
            font-weight: bold;
        `;
        finalResults.appendChild(separator);
    }, 200);
    
    backNumbers.forEach((num, index) => {
        setTimeout(() => {
            const ball = document.createElement('div');
            ball.className = 'final-ball';
            ball.style.background = 'linear-gradient(45deg, #9b59b6, #8e44ad)';
            ball.style.cssText += `
                width: 45px;
                height: 45px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 1.1em;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                animation: ballAppear 0.8s ease-out;
            `;
            ball.textContent = num;
            finalResults.appendChild(ball);
            
            playBallConfirmSound();
            
            if (index === backNumbers.length - 1) {
                chamberLabel.textContent = '🟣 后区摇奖完成！';
            }
        }, 500 + index * 800);
    });
}

// 修复formatDrawResultNumbers函数，确保正确显示大乐透开奖结果
function formatDrawResultNumbers(result) {
    if (result.type === 'doubleColor') {
        return `
            ${result.red.map(num => `<span class="history-ball red-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            <span class="history-ball blue-ball">${result.blue}</span>
        `;
    } else {
        return `
            ${result.front.map(num => `<span class="history-ball front-ball">${num}</span>`).join('')}
            <span class="separator">|</span>
            ${result.back.map(num => `<span class="history-ball back-ball">${num}</span>`).join('')}
        `;
    }
}

// 确保在页面加载时正确初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化开奖类型
    currentDrawType = 'doubleColor';
    
    // 延迟初始化，确保DOM完全加载
    setTimeout(() => {
        updateDrawTitle();
        updatePrizeTable();
    }, 100);
});

        } catch (error) {
            console.warn('音频上下文初始化失败:', error);
            this.isEnabled = false;
        }
    }
    
    playSound(frequency, duration = 0.2, volume = 0.1) {
        if (!this.isEnabled || !this.audioContext) {
            return;
        }
        
        try {
            if (this.audioContext.state === 'closed') {
                this.initAudioContext();
                if (!this.audioContext) return;
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.log('音频播放失败:', error);
            if (error.message.includes('audio device') || error.message.includes('WebAudio renderer')) {
                this.isEnabled = false;
                console.warn('音频设备错误，已禁用音效');
            }
        }
    }
    
    playSequence(notes, interval = 150, volume = 0.1) {
        if (!this.isEnabled || !this.audioContext) {
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
        console.log('开奖类型按钮更新失败:', error);
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

// 音效函数
function playRandomSelectSound() {
    audioManager.playSound(400, 0.5, 0.1);
    setTimeout(() => audioManager.playSound(800, 0.3, 0.08), 200);
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
    audioManager.playSound(600, 0.1, 0.1);
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
    const notes = [523, 659, 784, 1047, 1319];
    audioManager.playSequence(notes, 150, 0.12);
}

function playRandomTickSound() {
    audioManager.playSound(800 + Math.random() * 400, 0.1, 0.05);
}

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

// 调试工具
window.debugLottery = {
    checkHealth: function() {
        const checks = {
            dom: document.readyState === 'complete',
            localStorage: typeof Storage !== 'undefined',
            audioContext: audioManager.isEnabled,
            showTab: typeof showTab === 'function'
        };
        
        console.log('系统健康检查:', checks);
        return Object.values(checks).every(check => check);
    },
    
    testSounds: function() {
        console.log('测试音效系统...');
        if (!audioManager.isEnabled) {
            console.warn('音效系统已禁用');
            return;
        }
        
        playSelectSound();
        setTimeout(() => playDeselectSound(), 500);
        setTimeout(() => playRandomSelectSound(), 1000);
        setTimeout(() => playBallConfirmSound(), 1500);
        setTimeout(() => playRandomCompleteSound(), 2000);
    },
    
    fixAudio: function() {
        console.log('尝试修复音频系统...');
        audioManager.initAudioContext();
        if (audioManager.isEnabled) {
            console.log('✅ 音频系统修复成功');
            this.testSounds();
        } else {
            console.warn('❌ 音频系统修复失败');
        }
    },
    
    reinitialize: function() {
        if (confirm('确定要重新初始化系统吗？')) {
            location.reload();
        }
    },
    
    disableAudio: function() {
        audioManager.isEnabled = false;
        console.log('音效已禁用');
    },
    
    enableAudio: function() {
        audioManager.isEnabled = true;
        audioManager.initAudioContext();
        console.log('音效已启用');
    }
};

console.log('🎲 彩票系统已完全加载');
console.log('使用 debugLottery.checkHealth() 检查系统状态');

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