/**
 * 转盘功能模块
 * 版本: 2.0.0 - 完全修复版
 * 功能: 普通转盘、高级转盘、动画效果、音效、余额同步
 * 修复: 转盘旋转动画、余额实时同步、DOM元素检查
 */

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
            cost: 100,
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
        this.updateDisplay();
        this.bindEvents();
        console.log('✅ 转盘系统初始化完成');
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
    
    // 🔥 修复：转盘主函数
    spin() {
        try {
            console.log('🎰 开始转盘');
            
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
                        
                        this.showResult(reward);
                        this.addToHistory(reward);
                        this.updateDisplay();
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
            const currentBalance = this.getCurrentBalance();
            if (currentBalance < this.config.premiumWheel.cost) {
                this.showMessage(`余额不足，需要 ¥${this.config.premiumWheel.cost}`, 'error');
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
                const cost = this.config.premiumWheel.cost;
                const currentBalance = this.getCurrentBalance();
                
                if (currentBalance < cost) {
                    this.showMessage(`余额不足，需要 ¥${cost}`, 'error');
                    return false;
                }
                
                const deductSuccess = this.updateAccountBalance(-cost);
                
                if (!deductSuccess) {
                    this.showMessage('扣费失败，请稍后重试', 'error');
                    return false;
                }
                
                console.log(`💸 高级转盘扣费: ¥${cost}`);
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
            console.log('🔧 创建基础转盘元素');
            
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
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;
                
                wheelModal.innerHTML = `
                    <div class="wheel-modal-content" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        border-radius: 20px;
                        padding: 30px;
                        max-width: 600px;
                        width: 90%;
                        text-align: center;
                    ">
                        <div class="wheel-header">
                            <h2 style="color: white; margin-bottom: 20px;">🎰 幸运转盘</h2>
                            <button class="wheel-close" onclick="closeWheelModal()" style="
                                position: absolute;
                                top: 10px;
                                right: 15px;
                                background: none;
                                border: none;
                                color: white;
                                font-size: 24px;
                                cursor: pointer;
                            ">&times;</button>
                        </div>
                        
                        <div class="wheel-game">
                            <div class="wheel-wrapper" style="
                                position: relative;
                                width: 300px;
                                height: 300px;
                                margin: 0 auto;
                            ">
                                <div class="wheel-disc" id="wheelDisc" style="
                                    width: 100%;
                                    height: 100%;
                                    border-radius: 50%;
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
                                    border: 8px solid #fff;
                                    box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);
                                    position: relative;
                                "></div>
                                <div class="wheel-pointer" id="wheelPointer" style="
                                    position: absolute;
                                    top: -10px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    width: 0;
                                    height: 0;
                                    border-left: 15px solid transparent;
                                    border-right: 15px solid transparent;
                                    border-top: 30px solid #ff4757;
                                    z-index: 10;
                                "></div>
                                <div class="wheel-center" style="
                                    position: absolute;
                                    top: 50%;
                                    left: 50%;
                                    transform: translate(-50%, -50%);
                                    z-index: 5;
                                ">
                                    <button class="spin-btn" id="spinBtn" onclick="spinWheel()" style="
                                        width: 80px;
                                        height: 80px;
                                        border-radius: 50%;
                                        background: linear-gradient(135deg, #667eea, #764ba2);
                                        border: 4px solid white;
                                        color: white;
                                        font-weight: bold;
                                        font-size: 12px;
                                        cursor: pointer;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                    ">
                                        <span class="spin-text">开始转盘</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="wheel-result" id="wheelResult" style="
                            display: none;
                            text-align: center;
                            padding: 20px;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 12px;
                            margin-top: 20px;
                            color: white;
                        ">
                            <div class="result-content">
                                <div class="result-icon" style="font-size: 40px; margin-bottom: 10px;">🎉</div>
                                <div class="result-text" style="font-size: 16px; margin-bottom: 5px;">恭喜获得</div>
                                <div class="result-amount" style="font-size: 24px; font-weight: bold; color: #ffd700;">¥500</div>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(wheelModal);
                console.log('✅ 基础转盘元素已创建');
            }
            
            // 显示转盘
            wheelModal.style.display = 'flex';
            
        } catch (error) {
            console.error('❌ 创建基础转盘失败:', error);
        }
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
    },
    
    // 添加到历史记录
    addToHistory(reward) {
        const record = {
            type: this.data.currentType,
            reward: reward,
            timestamp: Date.now(),
            date: new Date().toLocaleString()
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
            
            // 确保window.accountBalance是数字类型
            if (typeof window.accountBalance === 'undefined') {
                window.accountBalance = 1000;
            }
            
            if (typeof window.accountBalance !== 'number') {
                const balanceText = window.accountBalance.toString();
                window.accountBalance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 1000;
            }
            
            window.accountBalance = parseFloat(window.accountBalance) || 1000;
            
            const oldBalance = window.accountBalance;
            window.accountBalance += amount;
            
            console.log(`💳 余额变化: ¥${oldBalance} → ¥${window.accountBalance}`);
            
            // 调用主系统更新函数
            if (typeof updateAccountDisplay === 'function') {
                updateAccountDisplay();
                console.log('✅ 主系统余额显示已更新');
            } else {
                console.warn('⚠️ updateAccountDisplay函数不存在');
            }
            
            if (typeof saveData === 'function') {
                saveData();
                console.log('✅ 主系统数据已保存');
            } else {
                console.warn('⚠️ saveData函数不存在');
            }
            
            // 强制更新余额显示
            this.forceUpdateBalanceDisplay();
            this.updateStatsDisplay();
            
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
    },
    
    // 更新统计显示
    updateStatsDisplay() {
        const freeSpinsLeft = this.config.normalWheel.dailyFreeSpins - this.data.freeSpinsUsed;
        const currentBalance = this.getCurrentBalance();
        
        const freeSpinsElement = document.getElementById('freeSpinsLeft');
        const balanceElement = document.getElementById('wheelBalance');
        
        if (freeSpinsElement) {
            freeSpinsElement.textContent = Math.max(0, freeSpinsLeft);
        }
        
        if (balanceElement) {
            balanceElement.textContent = `¥${currentBalance.toLocaleString()}`;
        }
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
                element.textContent = sector.value >= 1000 ? 
                    `${(sector.value / 1000).toFixed(0)}K` : 
                    sector.value;
                element.style.transform = `rotate(${sector.angle}deg)`;
            }
        });
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
                
                return `
                    <div class="history-item">
                        <span class="history-time">${timeStr}</span>
                        <span class="history-type">${typeText}转盘</span>
                        <span class="history-amount">+¥${record.reward.toLocaleString()}</span>
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
            spinHistory: this.data.spinHistory
        };
    }
};

// 全局函数，供HTML调用
function openWheelModal() {
    const modal = document.getElementById('wheelModal');
    if (modal) {
        modal.style.display = 'flex';
        WheelModule.updateDisplay();
    } else {
        // 如果没有转盘模态框，创建一个
        WheelModule.createBasicWheel();
        WheelModule.updateDisplay();
    }
}

function closeWheelModal() {
    const modal = document.getElementById('wheelModal');
    if (modal) {
        modal.style.display = 'none';
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
        }
    };
}

console.log('🎰 转盘模块加载完成 v2.0.0 - 完全修复版');