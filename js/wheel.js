// 在文件开头添加确保转盘图标显示的代码
document.addEventListener('DOMContentLoaded', function() {
    // 确保转盘入口按钮始终显示
    const wheelEntrance = document.querySelector('.wheel-entrance');
    if (wheelEntrance) {
        wheelEntrance.style.display = 'block';
        wheelEntrance.style.visibility = 'visible';
        wheelEntrance.style.opacity = '1';
        console.log('🎰 转盘入口按钮已确保显示');
    }
});

const WheelModule = {
    // 配置选项
    config: {
        normalWheel: {
            minReward: 50,
            maxReward: 500,
            dailyFreeSpins: 3,
            cost: 0
        },
        premiumWheel: {
            minReward: 50,
            maxReward: 5000000,
            baseCost: 100,        // 🔥 新增：基础费用
            maxCostLevel: 8,      // 🔥 新增：最大费用等级
            unlimited: true
        },
        storageKey: 'lotteryWheelData',
        version: '2.0.0'
    },
    
    // 转盘数据
    data: {
        currentType: 'normal', // normal | premium
        freeSpinsUsed: 0,
        lastResetDate: null,
        totalSpins: 0,
        totalWinnings: 0,
        spinHistory: [],
        premiumSpinCount: 0,  // 🔥 新增：高级转盘次数计数
        version: '2.0.0'
    },
    
    // 🔥 新增：多次转盘控制标志
    multiSpinCancelled: false,
    multiSpinPaused: false,
    isSpinning: false,
    
    // 转盘扇形配置
    wheelSectors: {
        normal: [
            { value: 50, color: '#ff6b6b', angle: 0 },
            { value: 100, color: '#4ecdc4', angle: 45 },
            { value: 200, color: '#45b7d1', angle: 90 },
            { value: 300, color: '#96ceb4', angle: 135 },
            { value: 500, color: '#feca57', angle: 180 },
            { value: 150, color: '#ff9ff3', angle: 225 },
            { value: 250, color: '#54a0ff', angle: 270 },
            { value: 400, color: '#5f27cd', angle: 315 }
        ],
        premium: [
            { value: 50, color: '#ff6b6b', angle: 0 },
            { value: 1000, color: '#4ecdc4', angle: 45 },
            { value: 5000, color: '#45b7d1', angle: 90 },
            { value: 10000, color: '#96ceb4', angle: 135 },
            { value: 50000, color: '#feca57', angle: 180 },
            { value: 100000, color: '#ff9ff3', angle: 225 },
            { value: 500000, color: '#54a0ff', angle: 270 },
            { value: 5000000, color: '#5f27cd', angle: 315 }
        ]
    },
    
    // 初始化转盘系统
    init() {
        console.log('🎰 转盘系统初始化中...');
        this.loadData();
        this.checkDailyReset();
        this.initializeBalance();
        // 🔥 完全移除主页显示更新
        // this.updateDisplay(); // 不在主页更新任何显示
        this.bindEvents();
        
        // 🔥 确保转盘按钮位置正确
        this.ensureButtonPosition();
        
        // 🔥 添加示例记录（仅在没有记录时）
        setTimeout(() => {
            if (this.data.spinHistory.length === 0) {
                if (typeof window.debugWheel !== 'undefined' && window.debugWheel.addSampleSpinHistory) {
                    window.debugWheel.addSampleSpinHistory();
                }
            }
        }, 1000);
        
        console.log('✅ 转盘系统初始化完成');
    },
    
    // 🔥 新增：确保转盘按钮位置正确
    ensureButtonPosition() {
        const wheelEntrance = document.querySelector('.wheel-entrance');
        if (wheelEntrance) {
            // 确保按钮在正确位置
            wheelEntrance.style.position = 'fixed';
            wheelEntrance.style.top = '20%';
            wheelEntrance.style.right = '30px';
            wheelEntrance.style.zIndex = '1000';
            wheelEntrance.style.display = 'block';
            
            // 移除任何可能导致遮挡的样式
            wheelEntrance.style.transform = 'translateY(-50%)';
            
            console.log('🎰 转盘按钮位置已确保正确');
        }
    },
    
    // 🔥 修复：计算高级转盘费用（当前转盘的费用）
    getPremiumWheelCost() {
        const spinCount = this.data.premiumSpinCount;
        const baseCost = this.config.premiumWheel.baseCost;
        const maxLevel = this.config.premiumWheel.maxCostLevel;
        
        
        const currentLevel = Math.min(spinCount + 1, maxLevel);
        
        if (spinCount >= maxLevel - 1) {
            
            return baseCost * Math.pow(2, maxLevel - 1);
        } else {
           
            return baseCost * Math.pow(2, spinCount);
        }
    },
    
    // 🔥 新增：获取费用描述文本
    getPremiumCostDescription() {
        const currentCost = this.getPremiumWheelCost();
        const spinCount = this.data.premiumSpinCount;
        const maxLevel = this.config.premiumWheel.maxCostLevel;
        
        if (spinCount >= maxLevel) {
            return `¥${currentCost.toLocaleString()}/次 (已达最高)`;
        } else {
            const nextCost = this.config.premiumWheel.baseCost * Math.pow(2, spinCount + 1);
            return `¥${currentCost.toLocaleString()}/次 (下次¥${nextCost.toLocaleString()})`;
        }
    },
    
    // 🔥 修复：获取费用等级信息
    getCostLevelInfo() {
        const spinCount = this.data.premiumSpinCount;
        const maxLevel = this.config.premiumWheel.maxCostLevel;
        const currentCost = this.getPremiumWheelCost();
        
        // 当前等级：已经转了几次，下一次就是第几级
        const currentLevel = Math.min(spinCount + 1, maxLevel);
        
        return {
            level: currentLevel,
            maxLevel: maxLevel,
            currentCost: currentCost,
            isMaxLevel: spinCount >= maxLevel - 1, // 修复：第8次就是最高等级
            progress: Math.min((spinCount + 1) / maxLevel * 100, 100),
            spinCount: spinCount,
            nextLevel: Math.min(spinCount + 2, maxLevel)
        };
    },
    
    // 🔥 新增：初始化余额
    initializeBalance() {
        try {
            if (typeof window.accountBalance === 'undefined' || typeof window.accountBalance !== 'number') {
                const balanceElement = document.getElementById('accountBalance');
                if (balanceElement) {
                    const balanceText = balanceElement.textContent || balanceElement.innerText || '1000';
                    window.accountBalance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 1000;
                } else {
                    window.accountBalance = 1000;
                }
            }
            console.log('💰 转盘余额初始化完成:', window.accountBalance);
        } catch (error) {
            console.error('❌ 转盘余额初始化失败:', error);
            window.accountBalance = 1000;
        }
    },
    
    // 绑定事件
    bindEvents() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.storageKey) {
                this.loadData();
                this.updateDisplay();
            }
        });
    },
    
    // 检查每日重置
    checkDailyReset() {
        const today = new Date().toDateString();
        if (this.data.lastResetDate !== today) {
            this.data.freeSpinsUsed = 0;
            this.data.lastResetDate = today;
            this.saveData();
        }
    },
    
    // 切换转盘类型
    switchType(type) {
        this.data.currentType = type;
        this.updateWheelDisplay();
        this.updateTabsDisplay();
        this.updateStatsDisplay();
    },
    
    // 🔥 修复：转盘主函数（支持单次和多次）
    spin(times = 1) {
        try {
            console.log(`🎰 WheelModule.spin 被调用，次数: ${times}`);
            
            // 🔥 添加防重复调用保护
            if (this.isSpinning) {
                console.log('⚠️ 转盘正在运行中，忽略重复调用');
                this.showMessage('转盘正在运行中，请稍等...', 'warning');
                return false;
            }
            
        if (times === 1) {
            return this.singleSpin();
        } else {
            return this.multiSpin(times);
            }
        } catch (error) {
            console.error('❌ WheelModule.spin 出错:', error);
            this.showMessage('转盘功能出错，请刷新页面重试', 'error');
            return false;
        }
    },
    
    // 🔥 新增：单次转盘
    singleSpin() {
        try {
            console.log('🎰 开始单次转盘');
            
            // 显示单次抽奖通知
            const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
            const currentCost = this.data.currentType === 'normal' ? 0 : this.getPremiumWheelCost();
            this.showProgressNotification(`${wheelType}正在抽奖... (费用 ¥${currentCost.toLocaleString()})`, 'progress', 2000);
            
            if (!this.canSpin()) {
                return false;
            }
            
            const balanceBeforeSpin = this.getCurrentBalance();
            console.log(`💳 转盘前余额: ¥${balanceBeforeSpin}`);
            
            if (!this.deductCost()) {
                return false;
            }
            
            const balanceAfterCost = this.getCurrentBalance();
            console.log(`💳 扣费后余额: ¥${balanceAfterCost}`);
            
            this.startSpinAnimation();
            
            setTimeout(() => {
                const reward = this.generateReward();
                console.log(`🎁 转盘奖励: ¥${reward}`);
                
                this.stopAtReward(reward);
                
                setTimeout(() => {
                    const updateSuccess = this.updateBalance(reward);
                    
                    if (updateSuccess) {
                        const finalBalance = this.getCurrentBalance();
                        console.log(`💳 最终余额: ¥${finalBalance}`);
                        
                        // 🔥 增加转盘次数（用于费用计算）
                        if (this.data.currentType === 'premium') {
                            this.data.premiumSpinCount++;
                            console.log(`🎰 高级转盘次数增加至: ${this.data.premiumSpinCount}`);
                        }
                        
                        // 🔥 保存数据
                        this.saveData();
                        
                        this.showResult(reward);
                        this.addToHistory(reward);
                        
                        // 🔥 确保数据被正确保存
                        setTimeout(() => {
                            this.saveData();
                            console.log('🔄 转盘数据二次保存完成');
                        }, 500);
                        
                        this.updateDisplay(); // 这会更新下次费用提示
                        this.playWinSound();
                        this.showConfetti();
                    } else {
                        console.error('❌ 余额更新失败');
                        this.showMessage('奖励发放失败，请联系客服', 'error');
                    }
                }, 1000);
                
            }, 3000);
            
            return true;
            
        } catch (error) {
            console.error('❌ 转盘失败:', error);
            this.showMessage('转盘失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 🔥 新增：多次转盘
    multiSpin(times) {
        try {
            console.log(`🎰 开始${times}次转盘`);
            
            // 检查是否可以进行多次转盘
            if (!this.canMultiSpin(times)) {
                return false;
            }
            
            // 🔥 直接执行多次转盘，不需要确认对话框
            console.log(`🚀 直接执行${times}次转盘，跳过确认对话框`);
            this.executeMultiSpin(times);
            
            return true;
            
        } catch (error) {
            console.error('❌ 多次转盘失败:', error);
            this.showMessage('多次转盘失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 🔥 新增：检查是否可以进行多次转盘
    canMultiSpin(times) {
        if (times <= 0 || times > 100) {
            this.showMessage('转盘次数必须在1-100之间', 'warning');
            return false;
        }
        
        // 检查免费转盘次数
        if (this.data.currentType === 'normal') {
            const freeSpinsLeft = this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed;
            if (times > freeSpinsLeft) {
                this.showMessage(`今日免费转盘次数不足，还剩${freeSpinsLeft}次`, 'warning');
                return false;
            }
        } else {
            // 检查高级转盘余额
            const totalCost = this.calculateMultiSpinCost(times);
            const currentBalance = this.getCurrentBalance();
            
            if (currentBalance < totalCost) {
                this.showMessage(`余额不足，需要¥${totalCost.toLocaleString()}，当前余额¥${currentBalance.toLocaleString()}`, 'error');
                return false;
            }
        }
        
        return true;
    },
    
    // 🔥 新增：计算多次转盘总费用
    calculateMultiSpinCost(times) {
        if (this.data.currentType === 'normal') {
            return 0;
        }
        
        let totalCost = 0;
        let currentCount = this.data.premiumSpinCount;
        
        for (let i = 0; i < times; i++) {
            const cost = this.calculateCostForSpin(currentCount);
            totalCost += cost;
            currentCount++;
        }
        
        return totalCost;
    },
    
    // 🔥 新增：计算单次转盘费用（基于当前次数）
    calculateCostForSpin(spinCount) {
        const baseCost = this.config.premiumWheel.baseCost;
        const level = Math.min(Math.floor(spinCount / 2), this.config.premiumWheel.maxCostLevel - 1);
        return baseCost * Math.pow(2, level);
    },
    
    // 🔥 新增：显示多次转盘对话框
    showMultiSpinModal(times) {
        const totalCost = this.calculateMultiSpinCost(times);
        const typeText = this.data.currentType === 'normal' ? '免费转盘' : '高级转盘';
        
        // 创建模态框HTML
        const modalHTML = `
            <div class="multi-spin-modal">
                <h3>🎰 ${times}次${typeText}</h3>
                <div class="multi-spin-info">
                    <div class="info-row">
                        <span>转盘次数：</span>
                        <span class="highlight">${times}次</span>
                    </div>
                    <div class="info-row">
                        <span>总费用：</span>
                        <span class="cost-amount">¥${totalCost.toLocaleString()}</span>
                    </div>
                    <div class="info-row">
                        <span>当前余额：</span>
                        <span>¥${this.getCurrentBalance().toLocaleString()}</span>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="WheelModule.executeMultiSpin(${times}); WheelModule.closeMultiSpinModal()">开始转盘</button>
                    <button class="btn btn-secondary" onclick="WheelModule.closeMultiSpinModal()">取消</button>
                </div>
            </div>
        `;
        
        // 显示模态框
        this.showModalWithContent('多次转盘确认', modalHTML);
    },
    
    // 🔥 带通知的多次转盘执行
    executeMultiSpin(times) {
        console.log(`🚨 开始${times}次转盘，使用右侧通知显示进度`);
        
        // 清除之前的通知
        this.clearAllNotifications();
        
        // 显示开始通知
        const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
        const totalCost = this.calculateMultiSpinCost(times);
        this.showProgressNotification(`${wheelType} 准备执行 ${times} 次 (总费用 ¥${totalCost.toLocaleString()})`, 'progress', 2000);
        
        this.isSpinning = true;
        this.multiSpinCancelled = false;
        this.multiSpinPaused = false;
        
        // 🔥 使用带通知的基础循环
        this.executeBasicMultiSpinWithNotifications(times);
    },
    
    // 🔥 紧急版本：最基础的多次转盘（绝对不卡死）
    executeBasicMultiSpin(times) {
        console.log(`🚨 开始基础多次转盘：${times}次`);
        
        let currentSpin = 0;
        let totalRewards = 0;
        let totalCosts = 0;
        const results = [];
        
        // 🔥 使用最长的间隔，确保不卡死
        const intervalId = setInterval(() => {
            console.log(`🔄 执行第${currentSpin + 1}次转盘`);
        
            // 检查是否完成
            if (currentSpin >= times) {
                console.log('✅ 基础多次转盘完成');
                clearInterval(intervalId);
                this.isSpinning = false;
                
                // 美化的结果显示
                const netProfit = totalRewards - totalCosts;
                console.log(`📊 最终结果: 奖励¥${totalRewards}, 费用¥${totalCosts}, 净收益¥${netProfit}`);
                this.showBeautifulResult(times, totalRewards, totalCosts, netProfit);
                return;
            }
            
            try {
                // 执行单次转盘
                const spinResult = this.executeSimpleSingleSpin();
                
                if (spinResult.success) {
                    results.push(spinResult);
                    totalRewards += spinResult.reward;
                    totalCosts += spinResult.cost;
                    currentSpin++;
                    
                    console.log(`✅ 第${currentSpin}次完成，奖励¥${spinResult.reward}`);
                } else {
                    console.log(`❌ 第${currentSpin + 1}次失败:`, spinResult.error);
                    if (spinResult.error === '余额不足') {
                        clearInterval(intervalId);
                        this.isSpinning = false;
                        const netProfit = totalRewards - totalCosts;
                        this.showBeautifulResult(currentSpin, totalRewards, totalCosts, netProfit, true);
                        return;
                    }
                }
            } catch (error) {
                console.error('❌ 转盘执行异常:', error);
            }
            
        }, 500); // 每500ms执行一次，非常慢但绝对不会卡死
        
        // 保存ID用于清除
        this.currentMultiSpinInterval = intervalId;
        
        // 超时保护
        setTimeout(() => {
            if (this.currentMultiSpinInterval === intervalId) {
                console.log('⏰ 基础转盘超时');
                clearInterval(intervalId);
                this.isSpinning = false;
                alert('转盘超时停止');
            }
        }, times * 1000 + 10000); // 每次1秒 + 10秒缓冲
    },
    
    // 🔥 新增：美化的结果弹窗
    showBeautifulResult(completedTimes, totalRewards, totalCosts, netProfit, isIncomplete = false) {
        const statusIcon = isIncomplete ? '⚠️' : '🎉';
        const statusText = isIncomplete ? '转盘停止' : '转盘完成';
        const statusColor = isIncomplete ? '#f39c12' : '#4ecdc4';
        const profitColor = netProfit >= 0 ? '#4ecdc4' : '#ff6b6b';
        const profitText = netProfit >= 0 ? '净收益' : '净亏损';
        
        const resultHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
                animation: fadeIn 0.3s ease-out;
            " onclick="this.remove()">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 500px;
                    width: 90%;
                    color: white;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                    position: relative;
                " onclick="event.stopPropagation()">
                    
                    <!-- 状态图标 -->
                    <div style="
                        font-size: 60px;
                        margin-bottom: 20px;
                        animation: bounce 0.6s ease-out;
                    ">${statusIcon}</div>
                    
                    <!-- 标题 -->
                    <h2 style="
                        margin: 0 0 25px 0;
                        font-size: 28px;
                        font-weight: bold;
                        color: ${statusColor};
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">${statusText}！</h2>
                    
                    <!-- 完成次数 -->
                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 15px;
                        padding: 20px;
                        margin-bottom: 25px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 16px; opacity: 0.9; margin-bottom: 8px;">
                            ${isIncomplete ? '已完成次数' : '转盘次数'}
                        </div>
                        <div style="font-size: 32px; font-weight: bold; color: #ffd700;">
                            ${completedTimes}次
                        </div>
                    </div>
                    
                    <!-- 奖励统计 -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 30px;
                    ">
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 12px;
                            padding: 18px;
                            border: 1px solid rgba(76, 205, 196, 0.3);
                        ">
                            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">💰 总奖励</div>
                            <div style="font-size: 20px; font-weight: bold; color: #4ecdc4;">
                                ¥${totalRewards.toLocaleString()}
                            </div>
                        </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 12px;
                            padding: 18px;
                            border: 1px solid ${profitColor.replace('#', 'rgba(').replace('4ecdc4', '76, 205, 196').replace('ff6b6b', '255, 107, 107')}, 0.3);
                        ">
                            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 5px;">📊 ${profitText}</div>
                            <div style="font-size: 20px; font-weight: bold; color: ${profitColor};">
                                ¥${Math.abs(netProfit).toLocaleString()}
                            </div>
                        </div>
                    </div>
                    
                    ${totalCosts > 0 ? `
                    <!-- 费用信息 -->
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 12px;
                        padding: 15px;
                        margin-bottom: 25px;
                        font-size: 14px;
                        opacity: 0.9;
                    ">
                        💸 总费用: ¥${totalCosts.toLocaleString()}
                    </div>
                    ` : ''}
                    
                    ${isIncomplete ? `
                    <!-- 停止原因 -->
                    <div style="
                        background: rgba(243, 156, 18, 0.2);
                        border: 1px solid rgba(243, 156, 18, 0.5);
                        border-radius: 12px;
                        padding: 15px;
                        margin-bottom: 25px;
                        color: #f39c12;
                        font-size: 14px;
                    ">
                        ⚠️ 转盘因余额不足而停止
                    </div>
                    ` : ''}
                    
                    <!-- 关闭按钮 -->
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        padding: 15px 40px;
                        background: linear-gradient(135deg, #4ecdc4, #44a08d);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(76, 205, 196, 0.3);
                    ">
                        ✅ 确定
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.8) translateY(-50px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: scale(1) translateY(0); 
                    }
                }
                
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { 
                        transform: translate3d(0,0,0); 
                    }
                    40%, 43% { 
                        transform: translate3d(0,-15px,0); 
                    }
                    70% { 
                        transform: translate3d(0,-7px,0); 
                    }
                    90% { 
                        transform: translate3d(0,-2px,0); 
                    }
                }
            </style>
        `;
        
        // 创建并显示弹窗
        const resultModal = document.createElement('div');
        resultModal.innerHTML = resultHTML;
        document.body.appendChild(resultModal);
        
        // 3秒后自动关闭（可选）
        setTimeout(() => {
            if (resultModal.parentNode) {
                resultModal.remove();
            }
        }, 10000); // 10秒后自动关闭
    },
    
    // 🔥 新增：带通知的基础多次转盘
    executeBasicMultiSpinWithNotifications(times) {
        console.log(`🚨 开始带通知的多次转盘：${times}次`);
        let currentSpin = 0;
        let totalRewards = 0;
        let totalCosts = 0;
        const results = [];
        
        // 每次抽奖都显示进度通知
        
        // 🔥 使用较长的间隔，确保不卡死，但比之前快一些
        const intervalId = setInterval(() => {
            console.log(`🔄 执行第${currentSpin + 1}次转盘`);
            
            // 显示当前抽奖进度
            if (currentSpin < times) {
                const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
                this.showProgressNotification(`${wheelType} 正在抽奖 第${currentSpin + 1}次`, 'progress', 1000);
            }
            
            // Check for completion
            if (currentSpin >= times) {
                console.log('✅ 带通知的多次转盘完成');
                clearInterval(intervalId);
                this.isSpinning = false;
                
                // 显示完成通知
                const netProfit = totalRewards - totalCosts;
                const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
                const currentBalance = this.getCurrentBalance();
                this.showProgressNotification(
                    `🎉 ${wheelType} ${times}次全部完成！净收益 ¥${netProfit.toLocaleString()}，当前余额 ¥${currentBalance.toLocaleString()}`, 
                    'success', 
                    5000
                );
                
                // 1秒后显示详细总结弹窗
                setTimeout(() => {
                    this.showBeautifulResult(times, totalRewards, totalCosts, netProfit);
                }, 1000);
                
                return;
            }
            
            try {
                // 执行单次转盘
                const spinResult = this.executeSimpleSingleSpin();
                if (spinResult.success) {
                    results.push(spinResult);
                    totalRewards += spinResult.reward;
                    totalCosts += spinResult.cost;
                    currentSpin++;
                    
                    console.log(`✅ 第${currentSpin}次完成，奖励¥${spinResult.reward}`);
                } else {
                    console.log(`❌ 第${currentSpin + 1}次失败:`, spinResult.error);
                    if (spinResult.error === '余额不足') {
                        clearInterval(intervalId);
                        this.isSpinning = false;
                        
                        // 显示余额不足通知
                        const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
                        const currentBalance = this.getCurrentBalance();
                        this.showProgressNotification(
                            `⚠️ ${wheelType} 余额不足停止！已完成 ${currentSpin} 次，当前余额 ¥${currentBalance.toLocaleString()}`, 
                            'warning', 
                            5000
                        );
                        
                        // 1秒后显示总结弹窗
                        setTimeout(() => {
                            const netProfit = totalRewards - totalCosts;
                            this.showBeautifulResult(currentSpin, totalRewards, totalCosts, netProfit, true);
                        }, 1000);
                        
                        return;
                    }
                }
            } catch (error) {
                console.error('❌ 转盘执行异常:', error);
                // 显示错误通知
                this.showProgressNotification(`❌ 转盘执行异常: ${error.message}`, 'error', 4000);
            }
            
        }, 300); // 每300ms执行一次，比之前的500ms快一些
        
        this.currentMultiSpinInterval = intervalId;
        
        // 超时保护
        setTimeout(() => {
            if (this.currentMultiSpinInterval === intervalId) {
                console.log('⏰ 带通知转盘超时');
                clearInterval(intervalId);
                this.isSpinning = false;
                this.showProgressNotification('⏰ 转盘执行超时', 'error', 4000);
            }
        }, times * 500 + 15000); // 更合理的超时时间
    },
    
    // 🔥 新增：转盘模态框内的右侧通知系统
    showProgressNotification(message, type = 'info', duration = 3000) {
        // 确保转盘模态框存在
        const wheelModal = document.getElementById('wheelModal');
        if (!wheelModal) {
            console.warn('转盘模态框不存在，无法显示通知');
            return;
        }
        
        // 确保通知容器存在（在转盘模态框内）
        let notificationContainer = wheelModal.querySelector('#wheel-notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'wheel-notification-container';
            notificationContainer.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 10;
                max-width: 300px;
                pointer-events: none;
            `;
            wheelModal.appendChild(notificationContainer);
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        const notificationId = 'notification-' + Date.now();
        notification.id = notificationId;
        
        // 根据类型设置图标和颜色
        let icon, bgColor, borderColor;
        switch (type) {
            case 'progress':
                icon = '🎰';
                bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                borderColor = '#667eea';
                break;
            case 'success':
                icon = '✅';
                bgColor = 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
                borderColor = '#4ecdc4';
                break;
            case 'warning':
                icon = '⚠️';
                bgColor = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
                borderColor = '#f39c12';
                break;
            case 'error':
                icon = '❌';
                bgColor = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
                borderColor = '#ff6b6b';
                break;
            default:
                icon = 'ℹ️';
                bgColor = 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)';
                borderColor = '#74b9ff';
        }
        
        notification.style.cssText = `
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 10px;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            border-left: 4px solid ${borderColor};
            backdrop-filter: blur(10px);
            font-size: 14px;
            line-height: 1.4;
            pointer-events: auto;
            cursor: pointer;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            animation: slideInFromRight 0.3s ease-out forwards;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: flex-start; gap: 10px;">
                <div style="font-size: 18px; flex-shrink: 0;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; margin-bottom: 2px; font-size: 13px; opacity: 0.9;">
                        ${type === 'progress' ? '转盘进度' : type === 'success' ? '完成' : type === 'warning' ? '警告' : type === 'error' ? '错误' : '通知'}
                    </div>
                    <div>${message}</div>
                </div>
                <div style="font-size: 12px; opacity: 0.7; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">×</div>
            </div>
        `;
        
        // 点击关闭
        notification.onclick = () => notification.remove();
        
        // 添加到容器
        notificationContainer.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutToRight 0.3s ease-in forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        return notificationId;
    },
    
    // 🔥 新增：清除转盘模态框内的所有通知
    clearAllNotifications() {
        const wheelModal = document.getElementById('wheelModal');
        if (wheelModal) {
            const container = wheelModal.querySelector('#wheel-notification-container');
            if (container) {
                container.innerHTML = '';
            }
        }
    },
    
        // 🔥 超简单版本：使用setInterval的多次转盘
    startSimpleMultiSpin(times) {
        let currentSpin = 0;
        let totalRewards = 0;
        let totalCosts = 0;
        const results = [];
        
        console.log(`🚀 开始简单版多次转盘：${times}次`);
        console.log(`🔍 转盘类型: ${this.data.currentType}`);
        console.log(`💰 当前余额: ¥${this.getCurrentBalance()}`);
        
        // 🔥 使用setInterval，绝对不会卡死
        const intervalId = setInterval(() => {
            try {
                console.log(`🔄 转盘interval执行，当前第${currentSpin}次，目标${times}次`);
                
                // 检查取消状态
                if (this.multiSpinCancelled) {
                    console.log('🚫 多次转盘被取消');
                    clearInterval(intervalId);
                    this.finishMultiSpin(results, totalRewards, totalCosts, true);
                    return;
                }
                
                // 检查暂停状态
                if (this.multiSpinPaused) {
                    console.log('⏸️ 转盘暂停中...');
                    return; // 不执行，等待下次interval
                }
                
                // 检查是否完成
                if (currentSpin >= times) {
                    console.log('✅ 所有转盘完成');
                    clearInterval(intervalId);
                this.finishMultiSpin(results, totalRewards, totalCosts);
                return;
            }
            
                // 执行单次转盘
                console.log(`🎯 准备执行第${currentSpin + 1}次转盘`);
                const spinResult = this.executeSimpleSingleSpin();
                console.log(`🎲 转盘结果:`, spinResult);
                
                if (!spinResult.success) {
                    console.log('❌ 单次转盘失败：', spinResult.error);
                    if (spinResult.error === '余额不足') {
                        clearInterval(intervalId);
                        this.finishMultiSpin(results, totalRewards, totalCosts, true);
                        return;
                    }
                    // 其他错误继续执行
                    return;
                }
                
                // 记录结果
                results.push(spinResult);
                totalRewards += spinResult.reward;
                totalCosts += spinResult.cost;
                currentSpin++;
                
                console.log(`🎰 完成第${currentSpin}次转盘，奖励：¥${spinResult.reward}`);
                console.log(`📊 累计: 奖励¥${totalRewards}, 费用¥${totalCosts}, 净收益¥${totalRewards - totalCosts}`);
                
                // 更新进度（包含最后一次转盘的奖励）
                try {
                    if (this.data.currentType === 'premium') {
                        console.log('💎 更新高级转盘进度');
                        this.updatePremiumMultiSpinProgress(currentSpin, times, totalRewards, totalCosts, spinResult.reward);
                    } else {
                        console.log('🎯 更新普通转盘进度');
                        this.updateMultiSpinProgress(currentSpin, times, totalRewards, totalCosts, spinResult.reward);
                    }
                } catch (progressError) {
                    console.error('❌ 更新进度失败:', progressError);
                }
                
            } catch (error) {
                console.error('❌ 转盘执行错误:', error);
                // 不终止，继续执行
            }
        }, 150); // 每150ms执行一次，稍微慢一点避免卡死
        
        // 🔥 保存intervalId，以便取消时清除
        this.currentMultiSpinInterval = intervalId;
        console.log(`🔗 保存intervalId: ${intervalId}`);
        
        // 🔥 添加超时保护
        const timeoutMs = Math.max(times * 300, 60000); // 最多1分钟或每次转盘300ms
        console.log(`⏰ 设置超时保护: ${timeoutMs}ms`);
        setTimeout(() => {
            if (this.currentMultiSpinInterval === intervalId) {
                console.log('⏰ 多次转盘超时，自动终止');
                clearInterval(intervalId);
                this.finishMultiSpin(results, totalRewards, totalCosts, true);
            }
        }, timeoutMs);
    },
    
    // 🔥 超简单的单次转盘执行
    executeSimpleSingleSpin() {
        try {
            // 检查费用
            const cost = this.data.currentType === 'normal' ? 0 : this.getPremiumWheelCost();
            const currentBalance = this.getCurrentBalance();
            
            if (this.data.currentType === 'premium' && currentBalance < cost) {
                return { success: false, error: '余额不足' };
            }
            
            // 扣除费用
            if (this.data.currentType === 'premium') {
                const success = this.updateAccountBalance(-cost);
                if (!success) {
                    return { success: false, error: '扣费失败' };
                }
                this.data.premiumSpinCount++;
            } else {
                this.data.freeSpinsUsed++;
            }
            
            // 生成奖励
            const reward = this.generateReward();
            
            // 更新余额
            this.updateAccountBalance(reward);
            
            return {
                success: true,
                cost: cost,
                reward: reward,
                profit: reward - cost
            };
            
        } catch (error) {
            console.error('❌ 简单单次转盘执行失败:', error);
            return { success: false, error: error.message };
        }
    },
    
    // 检查是否可以转盘
    canSpin() {
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn && spinBtn.disabled) {
            return false;
        }
        
        if (this.data.currentType === 'normal') {
            const freeSpinsLeft = this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed;
            if (freeSpinsLeft <= 0) {
                this.showMessage('今日免费次数已用完，请明天再来或使用高级转盘', 'info');
                return false;
            }
        } else {
            // 🔥 修改：使用动态费用计算
            const cost = this.getPremiumWheelCost();
            const currentBalance = this.getCurrentBalance();
            if (currentBalance < cost) {
                this.showMessage(`余额不足，需要 ¥${cost.toLocaleString()}`, 'error');
                return false;
            }
        }
        
        return true;
    },
    
    // 🔥 修复：扣除费用
    deductCost() {
        try {
            if (this.data.currentType === 'normal') {
                this.data.freeSpinsUsed++;
                console.log(`🎯 使用免费次数，剩余: ${this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed}`);
            } else {
                // 🔥 修改：使用动态费用计算
                const cost = this.getPremiumWheelCost();
                const currentBalance = this.getCurrentBalance();
                
                if (currentBalance < cost) {
                    this.showMessage(`余额不足，需要 ¥${cost.toLocaleString()}`, 'error');
                    return false;
                }
                
                const deductSuccess = this.updateAccountBalance(-cost);
                
                if (!deductSuccess) {
                    this.showMessage('扣费失败，请稍后重试', 'error');
                    return false;
                }
                
                // 🔥 新增：增加高级转盘次数计数
                this.data.premiumSpinCount++;
                
                console.log(`💸 高级转盘扣费: ¥${cost.toLocaleString()}, 累计次数: ${this.data.premiumSpinCount}`);
            }
            
            this.saveData();
            return true;
            
        } catch (error) {
            console.error('❌ 扣除费用失败:', error);
            return false;
        }
    },
    
    // 🔥 完全修复：开始转盘动画
    startSpinAnimation() {
        console.log('🎰 开始转盘动画');
        
        const wheelDisc = document.getElementById('wheelDisc');
        const spinBtn = document.getElementById('spinBtn');
        const wheelPointer = document.getElementById('wheelPointer');
        
        // 🔥 如果找不到转盘元素，尝试创建基础元素
        if (!wheelDisc) {
            console.warn('❌ 找不到转盘元素，尝试创建基础转盘');
            this.createBasicWheel();
            
            // 重新获取元素
            const newWheelDisc = document.getElementById('wheelDisc');
            if (!newWheelDisc) {
                console.error('❌ 无法创建转盘元素，转盘功能不可用');
                return;
            }
        }
        
        const actualWheelDisc = document.getElementById('wheelDisc');
        
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.classList.add('spinning');
            const spinText = spinBtn.querySelector('.spin-text');
            if (spinText) {
                spinText.textContent = '转盘中...';
            }
        }
        
        if (wheelPointer) {
            wheelPointer.classList.add('spinning');
        }
        
        // 🔥 确保转盘开始旋转
        actualWheelDisc.classList.remove('wheel-spinning-continuous', 'wheel-spinning-fast', 'wheel-stopping', 'spinning-glow');
        actualWheelDisc.style.transform = 'rotate(0deg)';
        actualWheelDisc.style.transition = 'none';
        actualWheelDisc.style.animation = 'none';
        actualWheelDisc.offsetHeight;
        
        setTimeout(() => {
            actualWheelDisc.classList.add('wheel-spinning-fast', 'spinning-glow');
            console.log('✅ 转盘旋转动画已启动');
        }, 50);
        
        this.playSpinSound();
        this.currentSpinningWheel = actualWheelDisc;
        
        const resultElement = document.getElementById('wheelResult');
        if (resultElement) {
            resultElement.classList.remove('show');
        }
    },
    
    // 🔥 创建弹出式转盘界面
    createBasicWheel() {
        try {
            console.log('🔧 创建弹出式转盘界面');
            
            // 检查是否已有转盘模态框
            let wheelModal = document.getElementById('wheelModal');
            if (!wheelModal) {
                wheelModal = document.createElement('div');
                wheelModal.id = 'wheelModal';
                wheelModal.className = 'wheel-modal';
                wheelModal.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.85);
                    display: none;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(10px);
                    animation: modalFadeIn 0.4s ease-out;
                `;
                
                wheelModal.innerHTML = `
                    <div class="wheel-modal-content" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 24px;
                        padding: 40px;
                        max-width: 700px;
                        width: 95%;
                        max-height: 85vh;
                        text-align: center;
                        box-shadow: 
                            0 25px 80px rgba(0, 0, 0, 0.4),
                            0 0 0 1px rgba(255, 255, 255, 0.1),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2);
                        position: relative;
                        overflow-y: auto;
                        transform: scale(1);
                        animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    ">
                        <!-- 🔥 大方的关闭按钮 -->
                        <div class="wheel-header" style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                        ">
                            <h2 style="
                                color: white;
                                margin: 0;
                                font-size: 28px;
                                font-weight: bold;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                            ">🎰 幸运转盘</h2>
                            
                            <!-- 🔥 多种关闭方式 -->
                            <div class="close-buttons" style="display: flex; gap: 10px;">
                                <button class="wheel-minimize" onclick="minimizeWheelModal()" style="
                                    background: rgba(255, 255, 255, 0.2);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    color: white;
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    cursor: pointer;
                                    font-size: 18px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.3s ease;
                                " title="最小化">−</button>
                                
                                <button class="wheel-close" onclick="closeWheelModal()" style="
                                    background: rgba(231, 76, 60, 0.8);
                                    border: 2px solid rgba(231, 76, 60, 1);
                                    color: white;
                                    width: 40px;
                                    height: 40px;
                                    border-radius: 50%;
                                    cursor: pointer;
                                    font-size: 20px;
                                    font-weight: bold;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    transition: all 0.3s ease;
                                " title="关闭转盘">&times;</button>
                            </div>
                        </div>
                        
                        <!-- 转盘选择标签 -->
                        <div class="wheel-tabs" style="
                            display: flex;
                            gap: 15px;
                            margin-bottom: 30px;
                            justify-content: center;
                        ">
                            <button class="wheel-tab active" data-type="normal" onclick="switchWheelType('normal')" style="
                                padding: 12px 24px;
                                background: rgba(255, 255, 255, 0.2);
                                border: 2px solid rgba(255, 255, 255, 0.3);
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-weight: bold;
                            ">
                                <span class="tab-icon">🎯</span>
                                <span class="tab-title">普通转盘</span>
                                <div class="tab-desc" style="font-size: 11px; opacity: 0.8;">每天3次免费</div>
                            </button>
                            <button class="wheel-tab" data-type="premium" onclick="switchWheelType('premium')" style="
                                padding: 12px 24px;
                                background: rgba(255, 255, 255, 0.1);
                                border: 2px solid rgba(255, 255, 255, 0.2);
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                font-weight: bold;
                            ">
                                <span class="tab-icon">💎</span>
                                <span class="tab-title">高级转盘</span>
                                <div class="tab-desc" style="font-size: 11px; opacity: 0.8;">100元/次</div>
                            </button>
                        </div>
                        
                        <!-- 转盘信息 -->
                        <div class="wheel-info" style="
                            display: flex;
                            justify-content: space-around;
                            margin-bottom: 30px;
                            background: rgba(255, 255, 255, 0.1);
                            padding: 20px;
                            border-radius: 15px;
                        ">
                            <div class="stat-item" style="text-align: center;">
                                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 5px;">今日免费次数</div>
                                <div class="stat-value" id="freeSpinsLeft" style="color: #ffd700; font-weight: bold; font-size: 18px;">3</div>
                            </div>
                            <div class="stat-item" style="text-align: center;">
                                <div style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 5px;">当前余额</div>
                                <div class="stat-value" id="wheelBalance" style="color: #ffd700; font-weight: bold; font-size: 18px;">¥1000</div>
                            </div>
                        </div>
                        
                        <!-- 🔥 更大更美观的转盘 -->
                        <div class="wheel-game" style="margin-bottom: 30px;">
                            <div class="wheel-wrapper" style="
                                position: relative;
                                width: 350px;
                                height: 350px;
                                margin: 0 auto;
                            ">
                                <div class="wheel-disc" id="wheelDisc" style="
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 50%;
                                    position: relative;
                                    background: conic-gradient(
                                        #ff6b6b 0deg 45deg,
                                        #4ecdc4 45deg 90deg,
                                        #45b7d1 90deg 135deg,
                                        #96ceb4 135deg 180deg,
                                        #feca57 180deg 225deg,
                                        #ff9ff3 225deg 270deg,
                                        #54a0ff 270deg 315deg,
                                        #5f27cd 315deg 360deg
                                    );
                                    border: 10px solid #fff;
                                    box-shadow: 
                                        0 0 40px rgba(0, 0, 0, 0.4),
                                        inset 0 0 30px rgba(255, 255, 255, 0.2);
                                    transition: transform 4s cubic-bezier(0.23, 1, 0.32, 1);
                                ">
                                    ${this.createWheelSectors()}
                                </div>
                                
                                <!-- 转盘指针 -->
                                <div class="wheel-pointer" id="wheelPointer" style="
                                    position: absolute;
                                    top: -20px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    width: 0;
                                    height: 0;
                                    border-left: 20px solid transparent;
                                    border-right: 20px solid transparent;
                                    border-top: 40px solid #e74c3c;
                                    z-index: 10;
                                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
                                "></div>
                                
                                <!-- 转盘中心按钮 -->
                                <div class="wheel-center" style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    z-index: 5;
                                ">
                                    <button class="spin-btn" id="spinBtn" onclick="WheelModule.spin(1)" style="
                                        width: 100px;
                                        height: 100px;
                                        border-radius: 50%;
                                        background: linear-gradient(135deg, #667eea, #764ba2);
                                        border: 6px solid white;
                                        color: white;
                                        font-weight: bold;
                                        font-size: 14px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.3s ease;
                                        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
                                    ">
                                        <span class="spin-text">开始转盘</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 转盘结果 -->
                        <div class="wheel-result" id="wheelResult" style="
                            display: none;
                            text-align: center;
                            padding: 25px;
                            background: rgba(255, 255, 255, 0.15);
                            border-radius: 15px;
                            margin-bottom: 20px;
                            animation: resultShow 0.5s ease-out;
                        ">
                            <div class="result-content">
                                <div class="result-icon" style="font-size: 50px; margin-bottom: 15px;">🎉</div>
                                <div class="result-text" style="color: white; font-size: 18px; margin-bottom: 10px;">恭喜获得</div>
                                <div class="result-amount" style="color: #ffd700; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">¥500</div>
                            </div>
                        </div>
                        
                        <!-- 🔥 新增：多次转盘快捷按钮 -->
                        <div class="multi-spin-section" style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 15px;
                            padding: 20px;
                            margin-bottom: 20px;
                        ">
                            <h3 style="
                                color: white;
                                margin: 0 0 15px 0;
                                font-size: 18px;
                                text-align: center;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                            ">🎯 快速转盘</h3>
                            
                            <div class="spin-options" style="
                                display: grid;
                                grid-template-columns: repeat(4, 1fr);
                                gap: 10px;
                                margin-bottom: 15px;
                            ">
                                <button class="quick-spin-btn" onclick="WheelModule.spin(1)" style="
                                    padding: 12px 8px;
                                    background: linear-gradient(135deg, #667eea, #764ba2);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 12px;
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    font-size: 14px;
                                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                                ">
                                    <div>1次</div>
                                    <div style="font-size: 11px; opacity: 0.8;">单次转盘</div>
                                </button>
                                
                                <button class="quick-spin-btn" onclick="WheelModule.spin(10)" style="
                                    padding: 12px 8px;
                                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 12px;
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    font-size: 14px;
                                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                                ">
                                    <div>10次</div>
                                    <div style="font-size: 11px; opacity: 0.8;" id="cost10Times">快速连转</div>
                                </button>
                                
                                <button class="quick-spin-btn" onclick="WheelModule.spin(50)" style="
                                    padding: 12px 8px;
                                    background: linear-gradient(135deg, #feca57, #ff9a56);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 12px;
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    font-size: 14px;
                                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                                ">
                                    <div>50次</div>
                                    <div style="font-size: 11px; opacity: 0.8;" id="cost50Times">批量转盘</div>
                                </button>
                                
                                <button class="quick-spin-btn" onclick="WheelModule.spin(100)" style="
                                    padding: 12px 8px;
                                    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 12px;
                                    color: white;
                                    font-weight: bold;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                    font-size: 14px;
                                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                                ">
                                    <div>100次</div>
                                    <div style="font-size: 11px; opacity: 0.8;" id="cost100Times">极速转盘</div>
                                </button>
                            </div>
                            
                            <div class="cost-preview" style="
                                text-align: center;
                                color: rgba(255, 255, 255, 0.8);
                                font-size: 12px;
                                padding: 10px;
                                background: rgba(0, 0, 0, 0.2);
                                border-radius: 8px;
                            ">
                                <div id="costPreviewText">选择转盘次数查看费用预览</div>
                            </div>
                        </div>
                        
                        <!-- 🔥 转盘历史记录 -->
                        <div class="wheel-history" style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 15px;
                            padding: 20px;
                            margin: 20px 0;
                            backdrop-filter: blur(10px);
                        ">
                            <h3 style="
                                color: white;
                                margin: 0 0 15px 0;
                                font-size: 18px;
                                text-align: center;
                                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                            ">📊 转盘记录</h3>
                            
                            <div class="wheel-history-list" id="wheelHistoryList" style="
                                max-height: 200px;
                                overflow-y: auto;
                                background: rgba(0, 0, 0, 0.1);
                                border-radius: 10px;
                                padding: 10px;
                            ">
                                <div class="no-history" style="
                                    text-align: center;
                                    color: rgba(255, 255, 255, 0.7);
                                    padding: 20px;
                                    font-size: 14px;
                                ">暂无转盘记录</div>
                            </div>
                        </div>
                        
                        <!-- 🔥 底部操作按钮 -->
                        <div class="wheel-actions" style="
                            display: flex;
                            gap: 15px;
                            justify-content: center;
                            margin-top: 20px;
                        ">
                            <button onclick="closeWheelModal()" style="
                                padding: 12px 30px;
                                background: rgba(231, 76, 60, 0.8);
                                border: 2px solid rgba(231, 76, 60, 1);
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                                transition: all 0.3s ease;
                            ">🚪 退出转盘</button>
                            
                            <button onclick="WheelModule.resetData(); WheelModule.updateDisplay();" style="
                                padding: 12px 30px;
                                background: rgba(52, 152, 219, 0.8);
                                border: 2px solid rgba(52, 152, 219, 1);
                                border-radius: 25px;
                                color: white;
                                cursor: pointer;
                                font-weight: bold;
                                transition: all 0.3s ease;
                            ">🔄 重置数据</button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(wheelModal);
                
                // 🔥 添加点击外部关闭功能
                wheelModal.addEventListener('click', function(e) {
                    if (e.target === wheelModal) {
                        console.log('🚪 点击外部区域关闭转盘');
                        closeWheelModal();
                    }
                });
                
                // 🔥 添加ESC键关闭功能
                const handleEscapeKey = function(e) {
                    if (e.key === 'Escape' && wheelModal.style.display === 'flex') {
                        console.log('🚪 ESC键关闭转盘');
                        closeWheelModal();
                    }
                };
                
                // 移除旧的监听器，避免重复
                document.removeEventListener('keydown', handleEscapeKey);
                document.addEventListener('keydown', handleEscapeKey);
                
                console.log('✅ 大方的转盘界面已创建');
            }

            
        } catch (error) {
            console.error('❌ 创建转盘失败:', error);
        }
    },
    
    // 新增：创建转盘扇形
    createWheelSectors() {
        const sectors = this.wheelSectors[this.data.currentType] || this.wheelSectors.normal;
        return sectors.map((sector, index) => `
            <div class="wheel-sector" data-value="${sector.value}" style="
                position: absolute;
                top: 50%;
                left: 50%;
                width: 120px;
                height: 2px;
                transform-origin: 0 0;
                transform: rotate(${sector.angle}deg);
                color: white;
                font-weight: bold;
                font-size: 16px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: 10px;
            ">${sector.value}</div>
        `).join('');
    },
    
    // 🔥 修复：让转盘停在指定奖励位置
    stopAtReward(reward) {
        console.log('🎯 开始停止转盘，目标奖励:', reward);
        
        const wheelDisc = this.currentSpinningWheel || document.getElementById('wheelDisc');
        const wheelPointer = document.getElementById('wheelPointer');
        
        if (!wheelDisc) {
            console.error('❌ 找不到转盘元素，直接显示结果');
            setTimeout(() => {
                this.showResult(reward);
                this.addToHistory(reward);
                this.updateBalance(reward);
                this.updateDisplay();
                this.playWinSound();
                this.showConfetti();
            }, 1000);
            return;
        }
        
        wheelDisc.classList.remove('wheel-spinning-fast', 'wheel-spinning-continuous');
        
        if (wheelPointer) {
            wheelPointer.classList.remove('spinning');
        }
        
        const sectors = this.wheelSectors[this.data.currentType];
        let targetSector = sectors[0];
        let minDiff = Math.abs(sectors[0].value - reward);
        
        sectors.forEach(sector => {
            const diff = Math.abs(sector.value - reward);
            if (diff < minDiff) {
                minDiff = diff;
                targetSector = sector;
            }
        });
        
        const currentRotation = 0;
        const additionalSpins = 3;
        const targetAngle = 360 - targetSector.angle;
        const randomOffset = (Math.random() - 0.5) * 30;
        const finalRotation = currentRotation + (additionalSpins * 360) + targetAngle + randomOffset;
        
        console.log(`🎯 目标扇形: ${targetSector.value}, 最终角度: ${finalRotation}`);
        
        wheelDisc.classList.add('wheel-stopping');
        wheelDisc.style.transition = 'transform 2s cubic-bezier(0.23, 1, 0.32, 1)';
        wheelDisc.style.transform = `rotate(${finalRotation}deg)`;
        
        this.playSlowDownSound();
    },
    
    // 生成奖励
    generateReward() {
        const sectors = this.wheelSectors[this.data.currentType];
        const randomIndex = Math.floor(Math.random() * sectors.length);
        const selectedSector = sectors[randomIndex];
        
        if (this.data.currentType === 'premium') {
            const superJackpotChance = Math.random();
            if (superJackpotChance < 0.001) {
                return this.config.premiumWheel.maxReward;
            } else if (superJackpotChance < 0.01) {
                return 500000;
            } else if (superJackpotChance < 0.05) {
                return 100000;
            }
        }
        
        const minReward = this.config[this.data.currentType + 'Wheel'].minReward;
        const maxReward = Math.min(selectedSector.value * 1.5, 
            this.config[this.data.currentType + 'Wheel'].maxReward);
        
        return Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
    },
    
    // 🔥 修复：显示结果
    showResult(reward) {
        console.log('🎉 显示转盘结果:', reward);
        
        // 🔥 通知系统完全接管结果显示
        const currentBalance = this.getCurrentBalance();
        this.showProgressNotification(
            `🎉 恭喜获得 ¥${reward.toLocaleString()}！当前余额 ¥${currentBalance.toLocaleString()}`, 
            'success', 
            4000
        );
        
        const resultElement = document.getElementById('wheelResult');
        const spinBtn = document.getElementById('spinBtn');
        const wheelDisc = document.getElementById('wheelDisc');
        
        if (wheelDisc) {
            wheelDisc.classList.remove('wheel-spinning-fast', 'wheel-spinning-continuous', 'wheel-stopping', 'spinning-glow');
        }
        
        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.classList.remove('spinning');
            const spinText = spinBtn.querySelector('.spin-text');
            if (spinText) {
                spinText.textContent = '开始转盘';
            }
        }
        
        // 🔥 隐藏原有的结果显示区域
        if (resultElement) {
            resultElement.style.display = 'none';
            resultElement.classList.remove('show');
        }
        
        // 🔥 原有的showMessage已被通知系统替代
        
        // 🎉 触发转盘庆祝动画（大奖金额才触发）
        if (typeof celebrationManager !== 'undefined' && reward >= 50000) {
            celebrationManager.triggerWheelCelebration(reward);
        }
    },
    
    // 添加到历史记录
    addToHistory(reward) {
        // 🔥 计算本次转盘的费用
        const cost = this.data.currentType === 'normal' ? 0 : this.getPremiumWheelCost();
        
        const record = {
            type: this.data.currentType,
            reward: reward,
            cost: cost,
            profit: reward - cost, // 净收益（可能为负）
            timestamp: Date.now(),
            date: new Date().toLocaleString(),
            description: this.data.currentType === 'normal' ? '免费转盘' : '高级转盘'
        };
        
        this.data.spinHistory.unshift(record);
        this.data.totalSpins++;
        this.data.totalWinnings += reward;
        
        if (this.data.spinHistory.length > 50) {
            this.data.spinHistory = this.data.spinHistory.slice(0, 50);
        }
        
        this.saveData();
        this.updateHistoryDisplay();
    },
    
    // 🔥 修复：更新余额（转盘奖励）
    updateBalance(reward) {
        try {
            console.log(`🎁 发放转盘奖励: ¥${reward}`);
            const success = this.updateAccountBalance(reward);
            
            if (success) {
                console.log('✅ 转盘奖励发放成功');
                return true;
            } else {
                console.error('❌ 转盘奖励发放失败');
                return false;
            }
        } catch (error) {
            console.error('❌ 更新余额失败:', error);
            return false;
        }
    },
    
    // 🔥 完全修复：更新账户余额
    updateAccountBalance(amount) {
        try {
            console.log(`💰 转盘更新余额: ${amount > 0 ? '+' : ''}¥${amount}`);
            
            // 🔥 确保window.accountBalance是数字类型
            if (typeof window.accountBalance === 'undefined') {
                window.accountBalance = 1000;
            }
            
            if (typeof window.accountBalance !== 'number') {
                window.accountBalance = parseFloat(window.accountBalance) || 1000;
            }
            
            const oldBalance = window.accountBalance;
            window.accountBalance += amount;
            
            // 🔥 同步到主系统变量
            if (typeof accountBalance !== 'undefined') {
                accountBalance = window.accountBalance;
            }
            
            console.log(`💳 转盘余额变化: ¥${oldBalance} → ¥${window.accountBalance}`);
            
            // 🔥 立即保存到localStorage
            localStorage.setItem('globalAccountBalance', window.accountBalance.toString());
            localStorage.setItem('lotteryAccountBalance', window.accountBalance.toString());
            
            // 调用主系统更新函数
            if (typeof updateAccountDisplay === 'function') {
                updateAccountDisplay();
                console.log('✅ 主系统余额显示已更新');
            }
            
            if (typeof saveData === 'function') {
                saveData();
                console.log('✅ 主系统数据已保存');
            }
            
            // 强制更新余额显示
            this.forceUpdateBalanceDisplay();
            
            return true;
            
        } catch (error) {
            console.error('❌ 转盘更新账户余额失败:', error);
            return false;
        }
    },
    
    // 🔥 修复：强制更新余额显示
    forceUpdateBalanceDisplay() {
        try {
            const balance = parseFloat(window.accountBalance) || 0;
            
            // 更新主界面的余额显示
            const balanceElement = document.getElementById('accountBalance');
            if (balanceElement) {
                balanceElement.textContent = `¥ ${balance.toFixed(2)}`;
                balanceElement.style.animation = 'none';
                balanceElement.offsetHeight;
                balanceElement.style.animation = 'balanceUpdate 0.6s ease-out';
                console.log('💰 主界面余额显示已更新');
            }
            
            // 更新所有可能的余额显示元素
            const balanceElements = document.querySelectorAll('[data-balance], .account-balance, .balance-display, .current-balance');
            balanceElements.forEach(element => {
                if (element) {
                    element.textContent = `¥${balance.toFixed(2)}`;
                }
            });
            
            // 更新转盘模态框中的余额显示
            const wheelBalanceElement = document.getElementById('wheelBalance');
            if (wheelBalanceElement) {
                wheelBalanceElement.textContent = `¥${balance.toLocaleString()}`;
            }
            
        } catch (error) {
            console.error('❌ 强制更新余额显示失败:', error);
        }
    },
    
    // 🔥 修复：获取当前余额
    getCurrentBalance() {
        try {
            let balance = 0;
            
            if (typeof window.accountBalance !== 'undefined') {
                if (typeof window.accountBalance === 'number') {
                    balance = window.accountBalance;
                } else {
                    const balanceText = window.accountBalance.toString();
                    balance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 0;
                }
            } else {
                const balanceElement = document.getElementById('accountBalance');
                if (balanceElement) {
                    const balanceText = balanceElement.textContent || balanceElement.innerText || '0';
                    balance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 0;
                }
            }
            
            balance = Math.max(0, balance);
            return balance;
            
        } catch (error) {
            console.error('❌ 获取当前余额失败:', error);
            return 1000;
        }
    },
    
    // 更新显示
    updateDisplay() {
        this.updateStatsDisplay();
        this.updateWheelDisplay();
        this.updateHistoryDisplay();
        this.updateQuickSpinButtons();
    },
    
    // 更新统计显示
    updateStatsDisplay() {
        // 更新免费次数
        const freeSpinsElement = document.getElementById('freeSpinsLeft');
        if (freeSpinsElement) {
            const freeSpinsLeft = this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed;
            freeSpinsElement.textContent = Math.max(0, freeSpinsLeft);
        }
        
        // 更新余额显示
        const balanceElement = document.getElementById('wheelBalance');
        if (balanceElement) {
            const balance = this.getCurrentBalance();
            balanceElement.textContent = `¥${balance.toLocaleString()}`;
        }
        
        // 🔥 新增：更新高级转盘费用信息
        this.updatePremiumCostDisplay();
    },
    
    // 更新转盘显示
    updateWheelDisplay() {
        const wheelDisc = document.getElementById('wheelDisc');
        if (!wheelDisc) return;
        
        const sectors = this.wheelSectors[this.data.currentType];
        const sectorElements = wheelDisc.querySelectorAll('.wheel-sector');
        
        sectorElements.forEach((element, index) => {
            if (sectors[index]) {
                const sector = sectors[index];
                // 🔥 直接显示数字，不转换为K格式
                element.textContent = sector.value;
                element.style.transform = `rotate(${sector.angle}deg)`;
            }
        });
    },
    
    // 🔥 修复：更新高级转盘费用显示（加强版）
    updatePremiumCostDisplay() {
        const currentCost = this.getPremiumWheelCost();
        const spinCount = this.data.premiumSpinCount;
        
        console.log(`🎰 费用显示更新 - 当前次数: ${spinCount}, 当前费用: ¥${currentCost}`);
        
        // 更新转盘按钮文本
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn && this.data.currentType === 'premium') {
            const spinText = spinBtn.querySelector('.spin-text');
            if (spinText) {
                spinText.textContent = `转盘 ¥${currentCost.toLocaleString()}`;
            }
        } else if (spinBtn && this.data.currentType === 'normal') {
            const spinText = spinBtn.querySelector('.spin-text');
            if (spinText) {
                spinText.textContent = '开始转盘';
            }
        }
        
        // 🔥 更新所有相关的费用显示元素
        this.updateAllCostDisplays();
        
        // 🔥 实时更新下次费用提示
        this.updateNextCostHint();
        
        // 🔥 新增：显示费用等级进度
        this.updateCostLevelProgress();
    },
    
    // 🔥 新增：统一更新所有费用显示
    updateAllCostDisplays() {
        const currentCost = this.getPremiumWheelCost();
        
        // 查找所有可能显示费用的元素
        const costSelectors = [
            '.current-cost',
            '.premium-cost',
            '.wheel-cost',
            '[data-cost-display]'
        ];
        
        costSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (element.textContent.includes('费用') || element.textContent.includes('¥')) {
                    element.textContent = `当前费用: ¥${currentCost.toLocaleString()}`;
                }
            });
        });
        
        // 特别处理橘黄色区域的费用显示
        const orangeElement = document.querySelector('.next-cost-hint .hint-value');
        if (orangeElement && this.data.currentType === 'premium') {
            // 这里显示的应该是下次费用，不是当前费用
            const nextCost = this.getNextCost();
            orangeElement.textContent = `¥${nextCost.toLocaleString()}`;
        }
    },
    
    // 🔥 新增：获取下次转盘费用
    getNextCost() {
        const nextSpinCount = this.data.premiumSpinCount + 1;
        const baseCost = this.config.premiumWheel.baseCost;
        const maxLevel = this.config.premiumWheel.maxCostLevel;
        
        if (nextSpinCount >= maxLevel) {
            return baseCost * Math.pow(2, maxLevel - 1);
        } else {
            return baseCost * Math.pow(2, nextSpinCount);
        }
    },
    
    // 🔥 修复：更新下次费用提示
    updateNextCostHint() {
        let hintElement = document.getElementById('nextCostHint');
        if (!hintElement) {
            hintElement = document.createElement('div');
            hintElement.id = 'nextCostHint';
            hintElement.className = 'next-cost-hint';
            
            const wheelInfo = document.querySelector('.wheel-info');
            if (wheelInfo) {
                wheelInfo.appendChild(hintElement);
            }
        }
        
        if (this.data.currentType === 'premium') {
            const currentCost = this.getPremiumWheelCost();
            const currentSpinCount = this.data.premiumSpinCount;
            const nextSpinCount = currentSpinCount + 1;
            const maxLevel = this.config.premiumWheel.maxCostLevel;
            const baseCost = this.config.premiumWheel.baseCost;
            
            // 计算下次转盘的费用
            let nextCost;
            if (nextSpinCount >= maxLevel) {
                // 下次已经是最高等级
                nextCost = baseCost * Math.pow(2, maxLevel - 1);
            } else {
                // 下次转盘费用：第(nextSpinCount+1)次的费用
                nextCost = baseCost * Math.pow(2, nextSpinCount);
            }
            
            if (currentSpinCount < maxLevel - 1) {
                hintElement.innerHTML = `
                    <div class="hint-content">
                        <span class="hint-label">💡 下次特惠费用:</span>
                        <span class="hint-value">¥${nextCost.toLocaleString()}</span>
                    </div>
                `;
                hintElement.style.display = 'block';
            } else {
                hintElement.innerHTML = `
                    <div class="hint-content">
                        <span class="hint-label">🔥 已达最高费用等级</span>
                        <span class="hint-value">¥${currentCost.toLocaleString()}</span>
                    </div>
                `;
                hintElement.style.display = 'block';
            }
        } else {
            hintElement.style.display = 'none';
        }
    },
    
    // 🔥 新增：更新费用等级进度显示
    updateCostLevelProgress() {
        const levelInfo = this.getCostLevelInfo();
        
        // 查找或创建费用等级显示元素
        let levelDisplay = document.getElementById('premiumCostLevel');
        if (!levelDisplay) {
            levelDisplay = document.createElement('div');
            levelDisplay.id = 'premiumCostLevel';
            levelDisplay.className = 'premium-cost-level';
            
            const wheelInfo = document.querySelector('.wheel-info');
            if (wheelInfo) {
                wheelInfo.appendChild(levelDisplay);
            }
        }
        
        levelDisplay.innerHTML = `
            <div class="cost-level-header">
                <span class="level-title">高级转盘等级</span>
                <span class="level-indicator">Lv.${levelInfo.level}/${levelInfo.maxLevel}</span>
            </div>
            <div class="cost-level-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${levelInfo.progress}%"></div>
                </div>
                <div class="progress-text">
                    ${levelInfo.isMaxLevel ? '已达最高等级' : `下次升级需要 ${levelInfo.maxLevel - levelInfo.level + 1} 次`}
                </div>
            </div>
            <div class="cost-level-info">
                <span class="current-cost">当前费用: ¥${levelInfo.currentCost.toLocaleString()}</span>
            </div>
        `;
    },
    
    // 更新标签显示
    updateTabsDisplay() {
        const tabs = document.querySelectorAll('.wheel-tab');
        tabs.forEach(tab => {
            const type = tab.getAttribute('data-type');
            if (type === this.data.currentType) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
            
            // 🔥 修改：更新高级转盘描述
            if (type === 'premium') {
                const descElement = tab.querySelector('.tab-desc');
                if (descElement) {
                    descElement.textContent = this.getPremiumCostDescription();
                }
            }
        });
    },
    
    // 更新历史显示
    updateHistoryDisplay() {
        const historyList = document.getElementById('wheelHistoryList');
        if (!historyList) return;
        
        if (this.data.spinHistory.length === 0) {
            historyList.innerHTML = '<div class="no-history">暂无转盘记录</div>';
            return;
        }
        
        const historyHtml = this.data.spinHistory
            .slice(0, 10)
            .map(record => {
                const date = new Date(record.timestamp);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                const typeText = record.type === 'normal' ? '普通' : '高级';
                
                // 🔥 修复：显示详细的收支记录
                const cost = record.cost || 0;
                const reward = record.reward || 0;
                const profit = record.profit || (reward - cost);
                
                // 构建详细记录字符串
                let detailText = '';
                if (cost > 0) {
                    detailText = `-¥${cost.toLocaleString()} +¥${reward.toLocaleString()}`;
                } else {
                    detailText = `+¥${reward.toLocaleString()}`;
                }
                
                // 净收益显示
                const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
                const profitText = profit >= 0 ? `+¥${profit.toLocaleString()}` : `-¥${Math.abs(profit).toLocaleString()}`;
                
                return `
                    <div class="history-item">
                        <div class="history-main">
                            <span class="history-time">${timeStr}</span>
                            <span class="history-type">${typeText}转盘</span>
                        </div>
                        <div class="history-details">
                            <span class="history-transaction">${detailText}</span>
                            <span class="history-profit ${profitClass}">${profitText}</span>
                        </div>
                    </div>
                `;
            })
            .join('');
        
        historyList.innerHTML = historyHtml;
    },
    
    // 播放转盘音效
    playSpinSound() {
        try {
            if (typeof window.audioManager !== 'undefined' && window.audioManager.playSequence) {
                const spinNotes = [220, 247, 262, 294, 330, 349, 392, 440];
                window.audioManager.playSequence(spinNotes, 100, 0.1);
            }
        } catch (error) {
            console.log('🔇 转盘音效播放失败:', error);
        }
    },
    
    // 播放减速音效
    playSlowDownSound() {
        try {
            if (typeof window.audioManager !== 'undefined' && window.audioManager.playSequence) {
                const slowDownNotes = [440, 392, 349, 330, 294];
                window.audioManager.playSequence(slowDownNotes, 300, 0.15);
            }
        } catch (error) {
            console.log('🔇 减速音效播放失败:', error);
        }
    },
    
    // 播放中奖音效
    playWinSound() {
        try {
            if (typeof window.audioManager !== 'undefined' && window.audioManager.playSequence) {
                const winNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
                window.audioManager.playSequence(winNotes, 200, 0.2);
            }
        } catch (error) {
            console.log('🔇 中奖音效播放失败:', error);
        }
    },
    
    // 显示彩带效果
    showConfetti() {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.cssText = `
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    background: ${this.getRandomColor()};
                    left: ${Math.random() * 100}vw;
                    animation: confetti-fall 3s linear forwards;
                    z-index: 10001;
                    animation-delay: ${Math.random() * 2}s;
                `;
                
                document.body.appendChild(confetti);
                
                setTimeout(() => {
                    confetti.remove();
                }, 3000);
            }, i * 50);
        }
    },
    
    // 获取随机颜色
    getRandomColor() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 显示消息
    showMessage(message, type = 'info') {
        if (typeof CheckinModule !== 'undefined' && CheckinModule.showMessage) {
            CheckinModule.showMessage(message, type);
        } else {
            console.log(`📢 [${type.toUpperCase()}] ${message}`);
            alert(message);
        }
    },
    
    // 🔥 全新：豪华多次转盘进度弹窗
    showMultiSpinProgress(times) {
        const progressHTML = `
            <div class="luxury-multi-spin-progress" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 30px;
                max-width: 600px;
                width: 95%;
                color: white;
                font-family: 'Microsoft YaHei', sans-serif;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            ">
                <!-- 标题区域 -->
                <div style="text-align: center; margin-bottom: 25px;">
                    <h2 style="
                        margin: 0;
                        font-size: 24px;
                        font-weight: bold;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    ">
                        <span class="spinning-wheel" style="
                            display: inline-block;
                            animation: spin 2s linear infinite;
                            font-size: 28px;
                        ">🎰</span>
                        多次转盘进行中
                    </h2>
                    <div style="
                        font-size: 14px;
                        opacity: 0.9;
                        margin-top: 5px;
                    ">目标：${times}次转盘</div>
                    </div>

                <!-- 进度条区域 -->
                <div style="margin-bottom: 25px;">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    ">
                        <span style="font-size: 16px; font-weight: bold;">进度</span>
                        <span id="multiSpinProgressText" style="
                            font-size: 16px;
                            font-weight: bold;
                            color: #ffd700;
                        ">0 / ${times}</span>
                </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 15px;
                        height: 20px;
                        overflow: hidden;
                        position: relative;
                    ">
                        <div id="multiSpinProgressBar" style="
                            height: 100%;
                            width: 0%;
                            background: linear-gradient(90deg, #ffd700, #ffed4a);
                            border-radius: 15px;
                            transition: width 0.3s ease;
                            position: relative;
                        ">
                            <div style="
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
                                animation: shimmer 2s infinite;
                            "></div>
                    </div>
                    </div>
                    </div>

                <!-- 当前转盘状态 -->
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 25px;
                    backdrop-filter: blur(10px);
                ">
                    <div id="multiSpinStatus" style="
                        font-size: 16px;
                        text-align: center;
                        margin-bottom: 15px;
                        color: #ffd700;
                        font-weight: bold;
                    ">准备开始转盘...</div>
                    
                    <!-- 实时结果显示 -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 15px;
                        text-align: center;
                    ">
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 10px;
                            padding: 15px;
                        ">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">总奖励</div>
                            <div id="totalRewardsDisplay" style="
                                font-size: 18px;
                                font-weight: bold;
                                color: #4ecdc4;
                            ">¥0</div>
                </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 10px;
                            padding: 15px;
                        ">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">总费用</div>
                            <div id="totalCostsDisplay" style="
                                font-size: 18px;
                                font-weight: bold;
                                color: #ff6b6b;
                            ">¥0</div>
            </div>
                        <div style="
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 10px;
                            padding: 15px;
                        ">
                            <div style="font-size: 12px; opacity: 0.8; margin-bottom: 5px;">净收益</div>
                            <div id="netProfitDisplay" style="
                                font-size: 18px;
                                font-weight: bold;
                                color: #ffd700;
                            ">¥0</div>
                        </div>
                    </div>
                </div>

                <!-- 最近转盘记录 -->
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 20px;
                    margin-bottom: 25px;
                    max-height: 150px;
                    overflow-y: auto;
                ">
                    <div style="
                        font-size: 14px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        text-align: center;
                    ">🎯 最近转盘记录</div>
                    <div id="recentSpinResults" style="
                        font-size: 12px;
                        line-height: 1.6;
                    ">
                        <div style="text-align: center; opacity: 0.7; padding: 20px;">
                            等待转盘开始...
                        </div>
                    </div>
                </div>

                <!-- 控制按钮 -->
                <div style="
                    display: flex;
                    gap: 15px;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button id="pauseMultiSpinBtn" onclick="WheelModule.pauseMultiSpin()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #f39c12, #e67e22);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
                        font-size: 14px;
                    ">⏸️ 暂停</button>
                    
                    <button id="cancelMultiSpinBtn" onclick="WheelModule.cancelMultiSpin()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #e74c3c, #c0392b);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
                        font-size: 14px;
                    ">🚫 取消</button>
                    
                    <button id="emergencyStopBtn" onclick="WheelModule.emergencyStop()" style="
                        padding: 12px 24px;
                        background: linear-gradient(135deg, #8e44ad, #9b59b6);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(142, 68, 173, 0.3);
                        font-size: 14px;
                    ">🚨 紧急停止</button>
                </div>
            </div>

            <style>
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                
                .luxury-multi-spin-progress button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3) !important;
                }
            </style>
        `;
        
        this.showModalWithContent('🎰 多次转盘', progressHTML, false);
    },
    
    // 🔥 新增：专门为高级转盘设计的进度窗口（简化版）
    showPremiumMultiSpinProgress(times) {
        console.log('💎 开始创建高级转盘进度窗口');
        
        try {
            const totalCost = this.calculateMultiSpinCost(times);
            console.log(`💰 计算总费用: ¥${totalCost}`);
            
            const premiumProgressHTML = `
                <div style="
                    background: #ff6b6b;
                    border-radius: 15px;
                    padding: 30px;
                    color: white;
                    text-align: center;
                ">
                    <h2>💎 高级转盘进行中</h2>
                    <p>目标：${times}次 | 总投入：¥${totalCost.toLocaleString()}</p>
                    
                    <div style="margin: 20px 0;">
                        <div>进度: <span id="premiumSpinProgressText">0 / ${times}</span></div>
                        <div style="background: rgba(255,255,255,0.3); height: 20px; border-radius: 10px; margin: 10px 0;">
                            <div id="premiumSpinProgressBar" style="background: #ffd700; height: 100%; width: 0%; border-radius: 10px;"></div>
                        </div>
                    </div>
                    
                    <div id="premiumSpinStatus">准备开始高级转盘...</div>
                    
                    <div style="margin: 15px 0;">
                        <div>累计奖励: <span id="premiumTotalRewards">¥0</span></div>
                        <div>累计费用: <span id="premiumTotalCosts">¥0</span></div>
                        <div>净收益: <span id="premiumNetProfit">¥0</span></div>
                    </div>
                    
                    <div id="premiumRecentResults" style="max-height: 100px; overflow-y: auto; margin: 15px 0;">
                        等待高级转盘开始...
                    </div>
                    
                    <button onclick="WheelModule.cancelMultiSpin()">🚫 取消转盘</button>
                </div>
            `;
            
            console.log('💎 HTML创建成功，准备显示模态框');
            this.showModalWithContent('💎 高级转盘', premiumProgressHTML, false);
            console.log('💎 高级转盘进度窗口显示完成');
            
        } catch (error) {
            console.error('❌ 创建高级转盘进度窗口失败:', error);
            // 如果失败，使用简单的alert
            alert(`💎 高级转盘开始\n目标: ${times}次转盘`);
        }
    },
    
    // 🔥 新增：高级转盘专用进度更新函数
    updatePremiumMultiSpinProgress(current, total, totalRewards, totalCosts, lastSpinReward = 0) {
        const progressBar = document.getElementById('premiumSpinProgressBar');
        const progressText = document.getElementById('premiumSpinProgressText');
        const progressStatus = document.getElementById('premiumSpinStatus');
        const totalRewardsDisplay = document.getElementById('premiumTotalRewards');
        const totalCostsDisplay = document.getElementById('premiumTotalCosts');
        const netProfitDisplay = document.getElementById('premiumNetProfit');
        const recentResults = document.getElementById('premiumRecentResults');
        
        // 更新进度条
        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = percentage + '%';
        }
        
        // 更新进度文字
        if (progressText) {
            progressText.textContent = `${current} / ${total}`;
        }
        
        // 更新状态信息
        if (progressStatus) {
            if (current === 0) {
                progressStatus.textContent = '准备开始高级转盘...';
            } else if (current < total) {
                progressStatus.innerHTML = `🎰 完成第${current}次转盘，奖励：¥${lastSpinReward.toLocaleString()}`;
            } else {
                progressStatus.innerHTML = `🎉 所有高级转盘已完成！总共${total}次`;
            }
        }
        
        // 更新总奖励
        if (totalRewardsDisplay) {
            totalRewardsDisplay.textContent = `¥${totalRewards.toLocaleString()}`;
        }
        
        // 更新总费用
        if (totalCostsDisplay) {
            totalCostsDisplay.textContent = `¥${totalCosts.toLocaleString()}`;
        }
        
        // 更新净收益
        if (netProfitDisplay) {
            const netProfit = totalRewards - totalCosts;
            netProfitDisplay.textContent = `¥${netProfit.toLocaleString()}`;
            netProfitDisplay.style.color = netProfit >= 0 ? '#4ecdc4' : '#ff6b6b';
        }
        
        // 🔥 更新高级转盘记录
        if (recentResults && lastSpinReward > 0) {
            const newResult = document.createElement('div');
            newResult.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                margin: 5px 0;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 12px;
                border-left: 4px solid #ffd700;
                animation: slideInRight 0.4s ease-out;
                backdrop-filter: blur(5px);
            `;
            
            // 根据奖励金额设置颜色
            let rewardColor = '#ff6b6b';
            let rewardIcon = '💸';
            if (lastSpinReward >= 100000) {
                rewardColor = '#ffd700';
                rewardIcon = '💎';
            } else if (lastSpinReward >= 10000) {
                rewardColor = '#4ecdc4';
                rewardIcon = '💰';
            } else if (lastSpinReward >= 1000) {
                rewardColor = '#54a0ff';
                rewardIcon = '💵';
            }
            
            newResult.innerHTML = `
                <span style="font-weight: bold; color: #ffd700;">
                    ${rewardIcon} 第${current}次
                </span>
                <span style="color: ${rewardColor}; font-weight: bold; font-size: 14px;">
                    ¥${lastSpinReward.toLocaleString()}
                </span>
            `;
            
            // 清除初始占位符
            if (recentResults.textContent.includes('等待高级转盘开始')) {
                recentResults.innerHTML = '';
            }
            
            // 添加到顶部
            recentResults.insertBefore(newResult, recentResults.firstChild);
            
            // 保持最多显示8条记录
            while (recentResults.children.length > 8) {
                recentResults.removeChild(recentResults.lastChild);
            }
        }
    },
    
    // 🔥 豪华版：更新多次转盘进度（实时结果显示）
    updateMultiSpinProgress(current, total, totalRewards, totalCosts, lastSpinReward = 0) {
        const progressBar = document.getElementById('multiSpinProgressBar');
        const progressText = document.getElementById('multiSpinProgressText');
        const progressStatus = document.getElementById('multiSpinStatus');
        const totalRewardsDisplay = document.getElementById('totalRewardsDisplay');
        const totalCostsDisplay = document.getElementById('totalCostsDisplay');
        const netProfitDisplay = document.getElementById('netProfitDisplay');
        const recentSpinResults = document.getElementById('recentSpinResults');
        
        // 更新进度条
        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = percentage + '%';
        }
        
        // 更新进度文字
        if (progressText) {
            progressText.textContent = `${current} / ${total}`;
        }
        
        // 更新状态信息
        if (progressStatus) {
            if (current === 0) {
                progressStatus.textContent = '准备开始转盘...';
            } else if (current < total) {
                progressStatus.innerHTML = `🎰 完成第${current}次转盘，奖励：¥${lastSpinReward.toLocaleString()}`;
            } else {
                progressStatus.innerHTML = `🎉 所有转盘已完成！总共${total}次转盘`;
            }
        }
        
        // 更新总奖励
        if (totalRewardsDisplay) {
            totalRewardsDisplay.textContent = `¥${totalRewards.toLocaleString()}`;
        }
        
        // 更新总费用
        if (totalCostsDisplay) {
            totalCostsDisplay.textContent = `¥${totalCosts.toLocaleString()}`;
        }
        
        // 更新净收益
        if (netProfitDisplay) {
            const netProfit = totalRewards - totalCosts;
            netProfitDisplay.textContent = `¥${netProfit.toLocaleString()}`;
            netProfitDisplay.style.color = netProfit >= 0 ? '#4ecdc4' : '#ff6b6b';
        }
        
        // 🔥 新增：更新最近转盘记录
        if (recentSpinResults && lastSpinReward > 0) {
            // 创建新的转盘记录
            const newResult = document.createElement('div');
            newResult.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                margin: 4px 0;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                border-left: 3px solid #ffd700;
                animation: slideInRight 0.3s ease-out;
            `;
            
            const rewardColor = lastSpinReward >= 1000 ? '#4ecdc4' : 
                               lastSpinReward >= 500 ? '#ffd700' : '#ff6b6b';
            
            newResult.innerHTML = `
                <span style="font-weight: bold; color: #ffd700;">第${current}次</span>
                <span style="color: ${rewardColor}; font-weight: bold;">¥${lastSpinReward.toLocaleString()}</span>
            `;
            
            // 清除初始占位符
            if (recentSpinResults.textContent.includes('等待转盘开始')) {
                recentSpinResults.innerHTML = '';
            }
            
            // 添加到顶部
            recentSpinResults.insertBefore(newResult, recentSpinResults.firstChild);
            
            // 保持最多显示10条记录
            while (recentSpinResults.children.length > 10) {
                recentSpinResults.removeChild(recentSpinResults.lastChild);
            }
            
            // 添加滑入动画样式
            if (!document.getElementById('spinResultAnimation')) {
                const style = document.createElement('style');
                style.id = 'spinResultAnimation';
                style.textContent = `
                    @keyframes slideInRight {
                        from { 
                            opacity: 0; 
                            transform: translateX(20px); 
                        }
                        to { 
                            opacity: 1; 
                            transform: translateX(0); 
                        }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    },
    
    // 🔥 更新：取消多次转盘（清除interval）
    cancelMultiSpin() {
        console.log('🚫 用户取消多次转盘');
        this.multiSpinCancelled = true;
        
        // 🔥 清除interval
        if (this.currentMultiSpinInterval) {
            clearInterval(this.currentMultiSpinInterval);
            this.currentMultiSpinInterval = null;
            console.log('🚫 已清除转盘interval');
        }
        
        const cancelBtn = document.getElementById('cancelMultiSpinBtn');
        const pauseBtn = document.getElementById('pauseMultiSpinBtn');
        
        if (cancelBtn) {
            cancelBtn.textContent = '🚫 正在取消...';
            cancelBtn.disabled = true;
            cancelBtn.style.opacity = '0.6';
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.style.opacity = '0.6';
        }
        
        const statusElement = document.getElementById('multiSpinStatus');
        if (statusElement) {
            statusElement.textContent = '正在取消转盘...';
        }
    },
    
    // 🔥 新增：暂停/恢复多次转盘
    pauseMultiSpin() {
        if (!this.multiSpinPaused) {
            console.log('⏸️ 暂停多次转盘');
            this.multiSpinPaused = true;
            
            const pauseBtn = document.getElementById('pauseMultiSpinBtn');
            if (pauseBtn) {
                pauseBtn.textContent = '▶️ 继续';
                pauseBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            }
            
            const statusElement = document.getElementById('multiSpinStatus');
            if (statusElement) {
                statusElement.textContent = '转盘已暂停...';
            }
        } else {
            console.log('▶️ 恢复多次转盘');
            this.multiSpinPaused = false;
            
            const pauseBtn = document.getElementById('pauseMultiSpinBtn');
            if (pauseBtn) {
                pauseBtn.textContent = '⏸️ 暂停';
                pauseBtn.style.background = 'linear-gradient(135deg, #f39c12, #e67e22)';
            }
            
            const statusElement = document.getElementById('multiSpinStatus');
            if (statusElement) {
                statusElement.textContent = '转盘继续进行...';
            }
        }
    },
    
    // 🔥 更新：紧急停止功能（清除interval）
    emergencyStop() {
        console.log('🚨 紧急停止多次转盘');
        
        // 立即设置取消标志
        this.multiSpinCancelled = true;
        this.multiSpinPaused = false;
        
        // 🔥 立即清除interval
        if (this.currentMultiSpinInterval) {
            clearInterval(this.currentMultiSpinInterval);
            this.currentMultiSpinInterval = null;
            console.log('🚨 紧急清除转盘interval');
        }
        
        // 更新UI
        const emergencyBtn = document.getElementById('emergencyStopBtn');
        const cancelBtn = document.getElementById('cancelMultiSpinBtn');
        const pauseBtn = document.getElementById('pauseMultiSpinBtn');
        
        if (emergencyBtn) {
            emergencyBtn.textContent = '🚨 已紧急停止';
            emergencyBtn.disabled = true;
            emergencyBtn.style.opacity = '0.6';
        }
        
        if (cancelBtn) {
            cancelBtn.disabled = true;
            cancelBtn.style.opacity = '0.6';
        }
        
        if (pauseBtn) {
            pauseBtn.disabled = true;
            pauseBtn.style.opacity = '0.6';
        }
        
        const statusElement = document.getElementById('multiSpinStatus');
        if (statusElement) {
            statusElement.textContent = '🚨 紧急停止中...';
            statusElement.style.color = '#e74c3c';
            statusElement.style.fontWeight = 'bold';
        }
        
        // 强制关闭模态框（延迟执行）
        setTimeout(() => {
            this.closeMultiSpinModal();
            this.showMessage('🚨 多次转盘已紧急停止！', 'error');
        }, 500);
    },
    
    // 🔥 优化：完成多次转盘（支持取消情况）
    finishMultiSpin(results, totalRewards, totalCosts, isCancelled = false) {
        // 🔥 重置控制标志
        this.multiSpinCancelled = false;
        this.multiSpinPaused = false;
        this.isSpinning = false;  // 🔥 重置转盘运行状态
        
        // 🔥 确保清除interval
        if (this.currentMultiSpinInterval) {
            clearInterval(this.currentMultiSpinInterval);
            this.currentMultiSpinInterval = null;
            console.log('🔄 完成时清除转盘interval');
        }
        
        // 添加批量记录到历史
        this.addBatchToHistory(results);
        
        // 保存数据（批量保存，提高性能）
        this.saveData();
        
        // 更新显示（只更新一次，提高性能）
        this.updateDisplay();
        this.forceUpdateBalanceDisplay();
        
        // 显示结果
        const netProfit = totalRewards - totalCosts;
        const profitText = netProfit >= 0 ? `净收益 ¥${netProfit.toLocaleString()}` : `净亏损 ¥${Math.abs(netProfit).toLocaleString()}`;
        
        const completedCount = results.length;
        
        // 🔥 延迟1秒后显示最终汇总
        setTimeout(() => {
            this.closeMultiSpinModal();
            
            // 根据转盘类型显示不同的汇总
            if (this.data.currentType === 'premium') {
                this.showPremiumFinalSummary(results, totalRewards, totalCosts, isCancelled);
            } else {
                this.showFinalMultiSpinSummary(results, totalRewards, totalCosts, isCancelled);
            }
            
            // 大奖庆祝
            if (!isCancelled && totalRewards >= 50000) {
                this.showConfetti();
                if (typeof celebrationManager !== 'undefined') {
                    celebrationManager.triggerWheelCelebration(totalRewards);
                }
            }
        }, 1000);
        
        console.log(`🎰 多次转盘${isCancelled ? '取消' : '完成'}：${completedCount}次，奖励¥${totalRewards}，${profitText}`);
    },
    
    // 🔥 新增：显示最终多次转盘汇总弹窗
    showFinalMultiSpinSummary(results, totalRewards, totalCosts, isCancelled = false) {
        const completedCount = results.length;
        const netProfit = totalRewards - totalCosts;
        const profitText = netProfit >= 0 ? '净收益' : '净亏损';
        const profitColor = netProfit >= 0 ? '#4ecdc4' : '#ff6b6b';
        const statusIcon = isCancelled ? '⚠️' : '🎉';
        const statusText = isCancelled ? '转盘已取消' : '转盘完成';
        const statusColor = isCancelled ? '#f39c12' : '#4ecdc4';
        
        // 计算统计信息
        const maxReward = results.length > 0 ? Math.max(...results.map(r => r.reward)) : 0;
        const minReward = results.length > 0 ? Math.min(...results.map(r => r.reward)) : 0;
        const avgReward = results.length > 0 ? Math.round(totalRewards / completedCount) : 0;
        
        const summaryHTML = `
            <div class="final-summary" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 20px;
                padding: 40px;
                max-width: 650px;
                width: 95%;
                color: white;
                font-family: 'Microsoft YaHei', sans-serif;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
                text-align: center;
            ">
                <!-- 状态标题 -->
                <div style="margin-bottom: 30px;">
                    <div style="
                        font-size: 60px;
                        margin-bottom: 15px;
                        animation: bounce 1s ease-out;
                    ">${statusIcon}</div>
                    <h2 style="
                        margin: 0;
                        font-size: 28px;
                        font-weight: bold;
                        color: ${statusColor};
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                    ">${statusText}！</h2>
                </div>

                <!-- 主要统计 -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 15px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">完成次数</div>
                        <div style="font-size: 24px; font-weight: bold; color: #ffd700;">
                            ${completedCount}次
                        </div>
                    </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 15px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">总奖励</div>
                        <div style="font-size: 24px; font-weight: bold; color: #4ecdc4;">
                            ¥${totalRewards.toLocaleString()}
                        </div>
                    </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.15);
                        border-radius: 15px;
                        padding: 20px;
                        backdrop-filter: blur(10px);
                    ">
                        <div style="font-size: 14px; opacity: 0.8; margin-bottom: 8px;">${profitText}</div>
                        <div style="font-size: 24px; font-weight: bold; color: ${profitColor};">
                            ¥${Math.abs(netProfit).toLocaleString()}
                        </div>
                    </div>
                </div>

                <!-- 详细统计 -->
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 15px;
                    padding: 25px;
                    margin-bottom: 30px;
                ">
                    <h3 style="
                        margin: 0 0 20px 0;
                        font-size: 18px;
                        color: #ffd700;
                    ">📊 详细统计</h3>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        text-align: left;
                    ">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="opacity: 0.8;">总费用：</span>
                                <span style="color: #ff6b6b; font-weight: bold;">¥${totalCosts.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="opacity: 0.8;">平均奖励：</span>
                                <span style="color: #ffd700; font-weight: bold;">¥${avgReward.toLocaleString()}</span>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="opacity: 0.8;">最高奖励：</span>
                                <span style="color: #4ecdc4; font-weight: bold;">¥${maxReward.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                <span style="opacity: 0.8;">最低奖励：</span>
                                <span style="color: #ff6b6b; font-weight: bold;">¥${minReward.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 确认按钮 -->
                <button onclick="WheelModule.closeFinalSummary()" style="
                    padding: 15px 40px;
                    background: linear-gradient(135deg, #4ecdc4, #44a08d);
                    border: none;
                    border-radius: 25px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 6px 20px rgba(76, 205, 196, 0.3);
                ">
                    ✅ 确认关闭
                </button>
            </div>

            <style>
                @keyframes bounce {
                    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
                    40%, 43% { transform: translate3d(0,-15px,0); }
                    70% { transform: translate3d(0,-7px,0); }
                    90% { transform: translate3d(0,-2px,0); }
                }
                
                .final-summary button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(76, 205, 196, 0.4) !important;
                }
            </style>
        `;
        
        this.showModalWithContent('🎰 转盘结果汇总', summaryHTML, false);
        
        // 记录日志
        console.log(`🎰 多次转盘完成：${completedCount}次，奖励¥${totalRewards}，净收益 ¥${netProfit.toLocaleString()}`);
    },
    
    // 🔥 新增：关闭最终汇总弹窗
    closeFinalSummary() {
        const modal = document.getElementById('wheelModal');
        if (modal) {
            modal.style.display = 'none';
        }
        
        // 关闭所有相关的模态框
        this.closeMultiSpinModal();
        console.log('✅ 最终汇总弹窗已关闭');
    },
    
    // 🔥 新增：高级转盘专用最终汇总弹窗
    showPremiumFinalSummary(results, totalRewards, totalCosts, isCancelled = false) {
        const completedCount = results.length;
        const netProfit = totalRewards - totalCosts;
        const profitText = netProfit >= 0 ? '净收益' : '净亏损';
        const profitColor = netProfit >= 0 ? '#4ecdc4' : '#ff6b6b';
        const statusIcon = isCancelled ? '⚠️' : '💎';
        const statusText = isCancelled ? '高级转盘已取消' : '高级转盘完成';
        const statusColor = isCancelled ? '#f39c12' : '#ffd700';
        
        // 计算统计信息
        const maxReward = results.length > 0 ? Math.max(...results.map(r => r.reward)) : 0;
        const minReward = results.length > 0 ? Math.min(...results.map(r => r.reward)) : 0;
        const avgReward = results.length > 0 ? Math.round(totalRewards / completedCount) : 0;
        
        // 计算投资回报率
        const roi = totalCosts > 0 ? ((netProfit / totalCosts) * 100).toFixed(1) : 0;
        
        const premiumSummaryHTML = `
            <div class="premium-final-summary" style="
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                border-radius: 25px;
                padding: 45px;
                max-width: 750px;
                width: 95%;
                color: white;
                font-family: 'Microsoft YaHei', sans-serif;
                box-shadow: 0 30px 100px rgba(0, 0, 0, 0.5);
                text-align: center;
                position: relative;
                overflow: hidden;
            ">
                <!-- 背景装饰 -->
                <div style="
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
                    animation: rotate 20s linear infinite;
                    pointer-events: none;
                "></div>
                
                <!-- 状态标题 -->
                <div style="margin-bottom: 35px; position: relative; z-index: 2;">
                    <div style="
                        font-size: 80px;
                        margin-bottom: 20px;
                        animation: bounce 1.5s ease-out;
                        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
                    ">${statusIcon}</div>
                    <h2 style="
                        margin: 0;
                        font-size: 32px;
                        font-weight: bold;
                        color: ${statusColor};
                        text-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
                        letter-spacing: 2px;
                    ">${statusText}！</h2>
                </div>

                <!-- 主要统计 -->
                <div style="
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 25px;
                    margin-bottom: 35px;
                    position: relative;
                    z-index: 2;
                ">
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        padding: 25px;
                        backdrop-filter: blur(15px);
                        border: 2px solid rgba(255, 215, 0, 0.3);
                        transform: translateY(0);
                        transition: transform 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 15px; opacity: 0.9; margin-bottom: 10px;">💎 完成次数</div>
                        <div style="font-size: 28px; font-weight: bold; color: #ffd700;">
                            ${completedCount}次
                        </div>
                    </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        padding: 25px;
                        backdrop-filter: blur(15px);
                        border: 2px solid rgba(76, 205, 196, 0.3);
                        transform: translateY(0);
                        transition: transform 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 15px; opacity: 0.9; margin-bottom: 10px;">💰 总奖励</div>
                        <div style="font-size: 28px; font-weight: bold; color: #4ecdc4;">
                            ¥${totalRewards.toLocaleString()}
                        </div>
                    </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 20px;
                        padding: 25px;
                        backdrop-filter: blur(15px);
                        border: 2px solid ${profitColor.replace('#', 'rgba(').replace('4ecdc4', '76, 205, 196').replace('ff6b6b', '255, 107, 107')}, 0.3);
                        transform: translateY(0);
                        transition: transform 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                        <div style="font-size: 15px; opacity: 0.9; margin-bottom: 10px;">📊 ${profitText}</div>
                        <div style="font-size: 28px; font-weight: bold; color: ${profitColor};">
                            ¥${Math.abs(netProfit).toLocaleString()}
                        </div>
                    </div>
                </div>

                <!-- 详细统计 -->
                <div style="
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 20px;
                    padding: 30px;
                    margin-bottom: 35px;
                    position: relative;
                    z-index: 2;
                ">
                    <h3 style="
                        margin: 0 0 25px 0;
                        font-size: 20px;
                        color: #ffd700;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                    ">
                        <span>📈</span>
                        <span>投资分析</span>
                        <span>📈</span>
                    </h3>
                    
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr;
                        gap: 20px;
                        text-align: left;
                    ">
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">💸 总投入：</span>
                                <span style="color: #ff6b6b; font-weight: bold;">¥${totalCosts.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">📊 投资回报率：</span>
                                <span style="color: ${roi >= 0 ? '#4ecdc4' : '#ff6b6b'}; font-weight: bold;">${roi}%</span>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">💰 平均奖励：</span>
                                <span style="color: #ffd700; font-weight: bold;">¥${avgReward.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">🎯 单次成本：</span>
                                <span style="color: #ff9ff3; font-weight: bold;">¥${totalCosts > 0 ? Math.round(totalCosts / completedCount).toLocaleString() : 0}</span>
                            </div>
                        </div>
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">🏆 最高奖励：</span>
                                <span style="color: #4ecdc4; font-weight: bold;">¥${maxReward.toLocaleString()}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.2);">
                                <span style="opacity: 0.9;">📉 最低奖励：</span>
                                <span style="color: #ff6b6b; font-weight: bold;">¥${minReward.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 确认按钮 -->
                <button onclick="WheelModule.closeFinalSummary()" style="
                    padding: 18px 50px;
                    background: linear-gradient(135deg, #ffd700, #ffed4a);
                    border: none;
                    border-radius: 30px;
                    color: #333;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
                    position: relative;
                    z-index: 2;
                    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                ">
                    ✅ 确认关闭
                </button>
            </div>

            <style>
                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .premium-final-summary button:hover {
                    transform: translateY(-3px) scale(1.05);
                    box-shadow: 0 12px 35px rgba(255, 215, 0, 0.6) !important;
                    background: linear-gradient(135deg, #ffed4a, #ffd700) !important;
                }
            </style>
        `;
        
        this.showModalWithContent('💎 高级转盘结果汇总', premiumSummaryHTML, false);
        
        // 记录日志
        console.log(`💎 高级转盘完成：${completedCount}次，奖励¥${totalRewards}，净收益 ¥${netProfit.toLocaleString()}`);
    },
    
    // 🔥 新增：批量添加到历史记录
    addBatchToHistory(results) {
        results.forEach(result => {
            const cost = result.cost || 0;
            const reward = result.reward || 0;
            const profit = result.profit || (reward - cost);
            
            const record = {
                type: this.data.currentType,
                reward: reward,
                cost: cost,
                profit: profit,
                timestamp: Date.now(),
                date: new Date().toLocaleString(),
                description: this.data.currentType === 'normal' ? '免费转盘' : '高级转盘',
                isBatch: true
            };
            
            this.data.spinHistory.unshift(record);
            this.data.totalSpins++;
            this.data.totalWinnings += reward;
        });
        
        // 限制历史记录数量
        if (this.data.spinHistory.length > 50) {
            this.data.spinHistory = this.data.spinHistory.slice(0, 50);
        }
        
        this.updateHistoryDisplay();
    },
    
    // 🔥 新增：通用模态框函数
    showModalWithContent(title, content, showCloseButton = true) {
        // 移除现有模态框
        const existingModal = document.querySelector('.wheel-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHTML = `
            <div class="wheel-modal-overlay">
                <div class="wheel-modal">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        ${showCloseButton ? '<button class="modal-close" onclick="WheelModule.closeMultiSpinModal()">×</button>' : ''}
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    },
    
    // 🔥 新增：关闭多次转盘模态框
    closeMultiSpinModal() {
        const modal = document.querySelector('.wheel-modal-overlay');
        if (modal) {
            modal.remove();
        }
    },
    
    // 🔥 新增：更新快捷按钮费用显示
    updateQuickSpinButtons() {
        const spinCounts = [10, 50, 100];
        
        spinCounts.forEach(count => {
            const element = document.getElementById(`cost${count}Times`);
            if (element) {
                if (this.data.currentType === 'normal') {
                    element.textContent = count <= 3 ? '免费转盘' : '超出免费次数';
                } else {
                    const totalCost = this.calculateMultiSpinCost(count);
                    element.textContent = `¥${totalCost.toLocaleString()}`;
                }
            }
        });
        
        // 更新费用预览
        const costPreview = document.getElementById('costPreviewText');
        if (costPreview) {
            if (this.data.currentType === 'normal') {
                const freeSpinsLeft = this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed;
                costPreview.textContent = `今日剩余免费次数：${freeSpinsLeft}次`;
            } else {
                const singleCost = this.getPremiumWheelCost();
                costPreview.textContent = `单次费用：¥${singleCost.toLocaleString()}，费用递增`;
            }
        }
    },
    
    // 保存数据
    saveData() {
        try {
            const dataToSave = {
                ...this.data,
                version: this.config.version,
                lastSaved: Date.now()
            };
            localStorage.setItem(this.config.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('❌ 保存转盘数据失败:', error);
        }
    },
    
    // 加载数据
    loadData() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = {
                    currentType: parsed.currentType || 'normal',
                    freeSpinsUsed: parsed.freeSpinsUsed || 0,
                    premiumSpinCount: parsed.premiumSpinCount || 0,
                    lastResetDate: parsed.lastResetDate || null,
                    totalSpins: parsed.totalSpins || 0,
                    totalWinnings: parsed.totalWinnings || 0,
                    spinHistory: parsed.spinHistory || [],
                    version: this.config.version
                };
            }
        } catch (error) {
            console.error('❌ 加载转盘数据失败:', error);
        }
    },
    
    // 重置数据
    resetData() {
        this.data = {
            currentType: 'normal',
            freeSpinsUsed: 0,
            premiumSpinCount: 0,
            lastResetDate: null,
            totalSpins: 0,
            totalWinnings: 0,
            spinHistory: [],
            version: this.config.version
        };
        this.saveData();
    },
    
    // 获取统计信息
    getStats() {
        return {
            totalSpins: this.data.totalSpins,
            totalWinnings: this.data.totalWinnings,
            freeSpinsLeft: this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed,
            currentBalance: this.getCurrentBalance(),
            premiumSpinCount: this.data.premiumSpinCount,
            premiumCost: this.getPremiumWheelCost(),
            premiumCostDescription: this.getPremiumCostDescription(),
            costLevelInfo: this.getCostLevelInfo(),
            spinHistory: this.data.spinHistory
        };
    }
};

// 全局函数，供HTML调用
function openWheelModal() {
    // 🔥 只在用户点击时才创建和显示转盘界面
    if (!document.getElementById('wheelModal')) {
        WheelModule.createBasicWheel();
    }
    
    // 清除之前的通知
    WheelModule.clearAllNotifications();
    
    const modal = document.getElementById('wheelModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // 🔥 强制重新计算和显示所有费用
        setTimeout(() => {
            WheelModule.loadData(); // 重新加载数据
            WheelModule.updateDisplay(); // 更新显示
            WheelModule.updatePremiumCostDisplay(); // 强制更新费用显示
            WheelModule.updateHistoryDisplay(); // 更新历史记录显示
            
            console.log('🎰 转盘模态框打开，费用显示和历史记录已更新');
        }, 100);
    }
}

function closeWheelModal() {
    // 清除所有通知
    WheelModule.clearAllNotifications();
    
    const modal = document.getElementById('wheelModal');
    if (modal) {
        // 添加关闭动画
        modal.style.animation = 'modalFadeOut 0.4s ease-in-out';
        const content = modal.querySelector('.wheel-modal-content');
        if (content) {
            content.style.animation = 'modalSlideOut 0.4s ease-in-out';
        }
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
            if (content) {
                content.style.animation = '';
            }
        }, 400);
        console.log('🚪 转盘弹出窗口已关闭');
    }
}

// 🔥 新增：全局转盘函数（兼容旧调用）
function spinWheel(times = 1) {
    return WheelModule.spin(times);
}

function minimizeWheelModal() {
    const modal = document.getElementById('wheelModal');
    if (modal) {
        modal.style.transform = 'scale(0.1)';
        modal.style.opacity = '0.3';
        modal.style.pointerEvents = 'none';
        
        // 3秒后恢复
        setTimeout(() => {
            modal.style.transform = 'scale(1)';
            modal.style.opacity = '1';
            modal.style.pointerEvents = 'auto';
        }, 3000);
        
        console.log('📦 转盘已最小化，3秒后恢复');
    }
}

function switchWheelType(type) {
    WheelModule.switchType(type);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        WheelModule.init();
    });
} else {
    WheelModule.init();
}

// 导出模块供其他脚本使用
if (typeof window !== 'undefined') {
    window.WheelModule = WheelModule;
}

// 🔥 完整调试工具
if (typeof window !== 'undefined') {
    window.debugWheel = {
        getStats: () => WheelModule.getStats(),
        resetData: () => {
            WheelModule.resetData();
            WheelModule.updateDisplay();
            console.log('✅ 转盘数据已重置');
        },
        addBalance: (amount) => {
            WheelModule.updateAccountBalance(amount);
            WheelModule.updateDisplay();
            console.log(`✅ 已添加余额: ¥${amount}`);
        },
        testSpin: () => {
            return WheelModule.spin();
        },
        checkDOM: () => {
            const elements = {
                wheelModal: document.getElementById('wheelModal'),
                wheelDisc: document.getElementById('wheelDisc'),
                spinBtn: document.getElementById('spinBtn'),
                wheelPointer: document.getElementById('wheelPointer'),
                wheelResult: document.getElementById('wheelResult'),
                freeSpinsLeft: document.getElementById('freeSpinsLeft'),
                wheelBalance: document.getElementById('wheelBalance')
            };
            
            console.log('🔍 转盘DOM元素检查:');
            Object.entries(elements).forEach(([key, element]) => {
                console.log(`${key}:`, element ? '✅ 存在' : '❌ 缺失', element);
            });
            
            return elements;
        },
        createWheel: () => {
            WheelModule.createBasicWheel();
            console.log('✅ 基础转盘已创建');
        },
        forceSpin: () => {
            console.log('🚀 强制开始转盘');
            WheelModule.startSpinAnimation();
            
            setTimeout(() => {
                WheelModule.stopAtReward(500);
            }, 3000);
            
            setTimeout(() => {
                WheelModule.showResult(500);
                WheelModule.addToHistory(500);
                WheelModule.updateBalance(500);
                WheelModule.updateDisplay();
            }, 6000);
        },
        checkBalance: () => {
            const wheelBalance = WheelModule.getCurrentBalance();
            const globalBalance = window.accountBalance;
            
            console.log('💰 余额检查:');
            console.log('转盘模块余额:', wheelBalance);
            console.log('全局余额变量:', globalBalance);
            console.log('余额类型:', typeof globalBalance);
            
            return {
                wheelBalance,
                globalBalance,
                balanceType: typeof globalBalance,
                isSync: Math.abs(wheelBalance - parseFloat(globalBalance)) < 0.01
            };
        },
        syncBalance: () => {
            WheelModule.forceUpdateBalanceDisplay();
            WheelModule.updateStatsDisplay();
            console.log('✅ 余额同步完成');
        },
        testBalanceUpdate: (amount = 100) => {
            console.log(`🧪 测试余额更新: ${amount > 0 ? '+' : ''}¥${amount}`);
            const before = WheelModule.getCurrentBalance();
            const success = WheelModule.updateAccountBalance(amount);
            const after = WheelModule.getCurrentBalance();
            
            console.log(`余额变化: ¥${before} → ¥${after}`);
            console.log(`更新${success ? '成功' : '失败'}`);
            
            return { before, after, success };
        },
        
        // 🔥 新增：检查转盘记录
        checkSpinHistory: () => {
            console.log('🎰 转盘记录检查:');
            console.log('总转盘次数:', WheelModule.data.totalSpins);
            console.log('总奖励:', WheelModule.data.totalWinnings);
            console.log('历史记录数量:', WheelModule.data.spinHistory.length);
            console.log('最近5次记录:', WheelModule.data.spinHistory.slice(0, 5));
            
            // 检查存储
            const savedData = localStorage.getItem(WheelModule.config.storageKey);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                console.log('存储中的记录数量:', parsed.spinHistory?.length || 0);
                console.log('存储中的总次数:', parsed.totalSpins || 0);
            } else {
                console.log('❌ 转盘数据未找到');
            }
            
            return {
                memoryCount: WheelModule.data.spinHistory.length,
                storageCount: savedData ? JSON.parse(savedData).spinHistory?.length || 0 : 0,
                totalSpins: WheelModule.data.totalSpins,
                totalWinnings: WheelModule.data.totalWinnings
            };
        },
        
        // 🔥 新增：强制保存转盘数据
        forceSaveWheelData: () => {
            WheelModule.saveData();
            console.log('🔄 强制保存转盘数据完成');
        },
        
        // 🔥 新增：添加示例转盘记录
        addSampleSpinHistory: () => {
            if (WheelModule.data.spinHistory.length === 0) {
                console.log('🎯 添加示例转盘记录');
                
                const sampleRecords = [
                    {
                        type: 'premium',
                        reward: 5000,
                        cost: 1600,
                        profit: 3400,
                        timestamp: Date.now() - 5 * 60 * 1000, // 5分钟前
                        date: new Date(Date.now() - 5 * 60 * 1000).toLocaleString(),
                        description: '高级转盘'
                    },
                    {
                        type: 'premium',
                        reward: 100,
                        cost: 800,
                        profit: -700,
                        timestamp: Date.now() - 15 * 60 * 1000, // 15分钟前
                        date: new Date(Date.now() - 15 * 60 * 1000).toLocaleString(),
                        description: '高级转盘'
                    },
                    {
                        type: 'normal',
                        reward: 250,
                        cost: 0,
                        profit: 250,
                        timestamp: Date.now() - 30 * 60 * 1000, // 30分钟前
                        date: new Date(Date.now() - 30 * 60 * 1000).toLocaleString(),
                        description: '免费转盘'
                    },
                    {
                        type: 'premium',
                        reward: 10000,
                        cost: 400,
                        profit: 9600,
                        timestamp: Date.now() - 60 * 60 * 1000, // 1小时前
                        date: new Date(Date.now() - 60 * 60 * 1000).toLocaleString(),
                        description: '高级转盘'
                    }
                ];
                
                WheelModule.data.spinHistory = sampleRecords;
                WheelModule.data.totalSpins = sampleRecords.length;
                WheelModule.data.totalWinnings = sampleRecords.reduce((sum, r) => sum + r.reward, 0);
                
                WheelModule.saveData();
                WheelModule.updateHistoryDisplay();
                console.log('✅ 示例转盘记录已添加');
            }
        },
        
        // 检查费用等级
        checkCostLevel: function() {
            const levelInfo = WheelModule.getCostLevelInfo();
            const currentCost = WheelModule.getPremiumWheelCost();
            
            console.log('🎰 高级转盘费用等级信息:');
            console.log('当前等级:', levelInfo.level);
            console.log('最大等级:', levelInfo.maxLevel);
            console.log('当前费用:', currentCost);
            console.log('累计次数:', WheelModule.data.premiumSpinCount);
            console.log('是否最高等级:', levelInfo.isMaxLevel);
            
            return levelInfo;
        },
        
        // 模拟转盘次数
        simulateSpins: function(count = 1) {
            console.log(`🧪 模拟 ${count} 次高级转盘`);
            
            for (let i = 0; i < count; i++) {
                const oldCount = WheelModule.data.premiumSpinCount;
                const oldCost = WheelModule.getPremiumWheelCost();
                
                WheelModule.data.premiumSpinCount++;
                
                const newCost = WheelModule.getPremiumWheelCost();
                
                console.log(`第${i+1}次: ${oldCount+1}次累计, 费用 ¥${oldCost} → ¥${newCost}`);
            }
            
            WheelModule.saveData();
            WheelModule.updateDisplay();
        },
        
        // 重置转盘次数
        resetSpinCount: function() {
            WheelModule.data.premiumSpinCount = 0;
            WheelModule.saveData();
            WheelModule.updateDisplay();
            console.log('✅ 高级转盘次数已重置');
        },
        
        // 🔥 新增：设置指定的转盘次数（用于测试费用显示）
        setSpinCount: function(count) {
            const oldCount = WheelModule.data.premiumSpinCount;
            const oldCost = WheelModule.getPremiumWheelCost();
            
            WheelModule.data.premiumSpinCount = Math.max(0, count);
            WheelModule.saveData();
            WheelModule.updateDisplay();
            
            const newCost = WheelModule.getPremiumWheelCost();
            const levelInfo = WheelModule.getCostLevelInfo();
            
            console.log(`✅ 转盘次数设置: ${oldCount} → ${count}`);
            console.log(`费用变化: ¥${oldCost} → ¥${newCost}`);
            console.log(`当前等级: Lv.${levelInfo.level}/${levelInfo.maxLevel}`);
        },
        
        // 显示费用表
        showCostTable: function() {
            console.log('🎰 高级转盘费用表:');
            for (let i = 0; i < 10; i++) {
                const cost = WheelModule.config.premiumWheel.baseCost * Math.pow(2, i);
                const level = i + 1;
                const isMax = i >= WheelModule.config.premiumWheel.maxCostLevel - 1;
                console.log(`第${level}次: ¥${cost.toLocaleString()} ${isMax ? '(最高)' : ''}`);
            }
        }
    };
}

console.log('🎰 转盘模块加载完成 v2.0.0 - 完全修复版');
console.log('🎰 转盘调试工具已加载，使用 debugWheel.checkCostLevel() 检查费用等级');