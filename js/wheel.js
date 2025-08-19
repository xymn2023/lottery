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
        if (times === 1) {
            return this.singleSpin();
        } else {
            return this.multiSpin(times);
        }
    },
    
    // 🔥 新增：单次转盘
    singleSpin() {
        try {
            console.log('🎰 开始单次转盘');
            
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
            
            // 显示多次转盘进度对话框
            this.showMultiSpinModal(times);
            
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
    
    // 🔥 新增：执行多次转盘
    executeMultiSpin(times) {
        let currentSpin = 0;
        let totalRewards = 0;
        let totalCosts = 0;
        const results = [];
        
        // 显示进度对话框
        this.showMultiSpinProgress(times);
        
        const executeSingleSpin = () => {
            if (currentSpin >= times) {
                // 完成所有转盘
                this.finishMultiSpin(results, totalRewards, totalCosts);
                return;
            }
            
            // 检查费用并扣除
            const cost = this.data.currentType === 'normal' ? 0 : this.getPremiumWheelCost();
            const currentBalance = this.getCurrentBalance();
            
            if (this.data.currentType === 'premium' && currentBalance < cost) {
                this.showMessage('余额不足，多次转盘终止', 'warning');
                this.finishMultiSpin(results, totalRewards, totalCosts);
                return;
            }
            
            // 扣除费用
            if (this.data.currentType === 'premium') {
                this.deductCost();
            } else {
                this.data.freeSpinsUsed++;
            }
            
            // 生成奖励
            const reward = this.generateReward();
            
            // 更新余额
            this.updateBalance(reward);
            
            // 记录结果
            results.push({ cost, reward, profit: reward - cost });
            totalRewards += reward;
            totalCosts += cost;
            currentSpin++;
            
            // 更新进度
            this.updateMultiSpinProgress(currentSpin, times, totalRewards, totalCosts);
            
            // 增加转盘次数
            if (this.data.currentType === 'premium') {
                this.data.premiumSpinCount++;
            }
            
            // 继续下一次转盘
            setTimeout(executeSingleSpin, 100);
        };
        
        // 开始执行
        executeSingleSpin();
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
    
    // 🔥 新增：创建基础转盘元素
    createBasicWheel() {
        try {
            console.log('🔧 创建大方的转盘界面');
            
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
                    backdrop-filter: blur(8px);
                    animation: modalFadeIn 0.3s ease-out;
                `;
                
                wheelModal.innerHTML = `
                    <div class="wheel-modal-content" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 24px;
                        padding: 40px;
                        max-width: 700px;
                        width: 95%;
                        max-height: 90vh;
                        text-align: center;
                        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                        position: relative;
                        overflow-y: auto;
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
                                    <button class="spin-btn" id="spinBtn" onclick="spinWheel()" style="
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
                        closeWheelModal();
                    }
                });
                
                // 🔥 添加ESC键关闭功能
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape' && wheelModal.style.display === 'flex') {
                        closeWheelModal();
                    }
                });
                
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
        
        if (resultElement) {
            const amountElement = resultElement.querySelector('.result-amount');
            if (amountElement) {
                amountElement.textContent = `¥${reward.toLocaleString()}`;
            }
            resultElement.style.display = 'block';
            resultElement.classList.add('show');
            
            setTimeout(() => {
                resultElement.classList.remove('show');
                resultElement.style.display = 'none';
            }, 5000);
        }
        
        const wheelType = this.data.currentType === 'normal' ? '普通转盘' : '高级转盘';
        this.showMessage(`🎉 ${wheelType}中奖！\n🎯 转盘停止\n💰 获得奖励: ¥${reward.toLocaleString()}`, 'success');
        
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
    
    // 🔥 新增：显示多次转盘进度
    showMultiSpinProgress(times) {
        const progressHTML = `
            <div class="multi-spin-progress">
                <h3>🎰 正在进行多次转盘</h3>
                <div class="progress-info">
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="multiSpinProgressBar" style="width: 0%"></div>
                    </div>
                    <div class="progress-text" id="multiSpinProgressText">0 / ${times}</div>
                </div>
                <div class="current-results">
                    <div class="result-item">
                        <span>总奖励：</span>
                        <span id="totalRewardsDisplay">¥0</span>
                    </div>
                    <div class="result-item">
                        <span>总费用：</span>
                        <span id="totalCostsDisplay">¥0</span>
                    </div>
                    <div class="result-item">
                        <span>净收益：</span>
                        <span id="netProfitDisplay">¥0</span>
                    </div>
                </div>
            </div>
        `;
        
        this.showModalWithContent('转盘进行中', progressHTML, false);
    },
    
    // 🔥 新增：更新多次转盘进度
    updateMultiSpinProgress(current, total, totalRewards, totalCosts) {
        const progressBar = document.getElementById('multiSpinProgressBar');
        const progressText = document.getElementById('multiSpinProgressText');
        const totalRewardsDisplay = document.getElementById('totalRewardsDisplay');
        const totalCostsDisplay = document.getElementById('totalCostsDisplay');
        const netProfitDisplay = document.getElementById('netProfitDisplay');
        
        if (progressBar) {
            const percentage = (current / total) * 100;
            progressBar.style.width = percentage + '%';
        }
        
        if (progressText) {
            progressText.textContent = `${current} / ${total}`;
        }
        
        if (totalRewardsDisplay) {
            totalRewardsDisplay.textContent = `¥${totalRewards.toLocaleString()}`;
        }
        
        if (totalCostsDisplay) {
            totalCostsDisplay.textContent = `¥${totalCosts.toLocaleString()}`;
        }
        
        if (netProfitDisplay) {
            const netProfit = totalRewards - totalCosts;
            netProfitDisplay.textContent = `¥${netProfit.toLocaleString()}`;
            netProfitDisplay.className = netProfit >= 0 ? 'profit-positive' : 'profit-negative';
        }
    },
    
    // 🔥 新增：完成多次转盘
    finishMultiSpin(results, totalRewards, totalCosts) {
        // 添加批量记录到历史
        this.addBatchToHistory(results);
        
        // 保存数据
        this.saveData();
        
        // 更新显示
        this.updateDisplay();
        
        // 显示结果
        const netProfit = totalRewards - totalCosts;
        const profitText = netProfit >= 0 ? `净收益 ¥${netProfit.toLocaleString()}` : `净亏损 ¥${Math.abs(netProfit).toLocaleString()}`;
        
        setTimeout(() => {
            this.closeMultiSpinModal();
            this.showMessage(`多次转盘完成！获得奖励 ¥${totalRewards.toLocaleString()}，${profitText}`, 'success');
            
            // 大奖庆祝
            if (totalRewards >= 50000) {
                this.showConfetti();
                if (typeof celebrationManager !== 'undefined') {
                    celebrationManager.triggerWheelCelebration(totalRewards);
                }
            }
        }, 1000);
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
    const modal = document.getElementById('wheelModal');
    if (modal) {
        modal.style.animation = 'modalFadeOut 0.3s ease-in';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = '';
        }, 300);
        console.log('🚪 转盘已关闭');
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

function spinWheel() {
    WheelModule.spin();
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