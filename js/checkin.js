/**
 * 签到功能模块
 * 版本: 2.0.0 - 完全重构版
 * 作者: 彩票系统开发团队
 * 功能: 每日签到、余额奖励、签到记录管理、补签功能、转出功能
 */

// 签到功能命名空间
const CheckinModule = {
    // 配置选项
    config: {
        minReward: 100,           // 最小奖励金额（保底100元）
        maxReward: 1000,          // 最大奖励金额（最高1000元）
        maxRecords: 30,           // 最大保存记录数
        maxMakeupDays: 7,         // 最大可补签天数
        storageKey: 'lotteryCheckinData',
        version: '2.0.0'
    },
    
    // 签到数据
    data: {
        lastCheckinDate: null,
        totalCheckins: 0,
        checkinStreak: 0,
        totalRewards: 0,
        checkinHistory: [],
        makeupHistory: [],
        transferHistory: [],      // 转出历史记录
        version: '2.0.0'
    },
    
    // 修复：初始化签到系统
    init() {
        console.log('🎯 签到系统初始化中...');
        
        // 确保余额变量正确初始化
        this.initializeBalance();
        
        this.loadData();
        this.updateDisplay();
        this.checkStatus();
        this.bindEvents();
        this.startAutoCheck();
        console.log('✅ 签到系统初始化完成');
    },
    
    // 新增：初始化余额
    initializeBalance() {
        try {
            // 如果 window.accountBalance 不存在或不是数字，初始化它
            if (typeof window.accountBalance === 'undefined' || typeof window.accountBalance !== 'number') {
                // 尝试从DOM元素获取余额
                const balanceElement = document.getElementById('accountBalance');
                if (balanceElement) {
                    const balanceText = balanceElement.textContent || balanceElement.innerText || '1000';
                    window.accountBalance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 1000;
                } else {
                    window.accountBalance = 1000; // 默认初始余额
                }
            }
            
            console.log('💰 余额初始化完成:', window.accountBalance);
        } catch (error) {
            console.error('❌ 余额初始化失败:', error);
            window.accountBalance = 1000;
        }
    },
    
    // 绑定事件
    bindEvents() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkStatus();
            }
        });
        
        window.addEventListener('storage', (e) => {
            if (e.key === this.config.storageKey) {
                this.loadData();
                this.updateDisplay();
                this.checkStatus();
            }
        });
    },
    
    // 开始自动检查
    startAutoCheck() {
        setInterval(() => this.checkStatus(), 60000);
        setInterval(() => this.validateData(), 3600000);
    },
    
    // 每日签到主函数
    checkin() {
        try {
            const today = new Date();
            const todayStr = this.formatDate(today);
            
            if (this.data.lastCheckinDate === todayStr) {
                this.showMessage('今日已签到，明天再来吧！', 'info');
                return false;
            }
            
            const reward = this.generateReward();
            this.updateAccountBalance(reward);
            this.updateCheckinData(todayStr, reward);
            this.saveData();
            this.updateDisplay();
            this.checkStatus();
            this.showSuccess(reward);
            this.playSound();
            
            console.log(`✅ 签到成功！获得奖励: ¥${reward}`);
            return true;
            
        } catch (error) {
            console.error('❌ 签到失败:', error);
            this.showMessage('签到失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 修复：更新账户余额
    updateAccountBalance(reward) {
        try {
            // 确保 window.accountBalance 是数字类型
            if (typeof window.accountBalance === 'undefined') {
                window.accountBalance = 1000; // 初始余额
            }
            
            // 如果是DOM元素，获取其数值
            if (typeof window.accountBalance === 'object') {
                const balanceText = window.accountBalance.textContent || window.accountBalance.innerText || '1000';
                window.accountBalance = parseFloat(balanceText.replace(/[^\d.-]/g, '')) || 1000;
            }
            
            // 确保是数字类型
            window.accountBalance = parseFloat(window.accountBalance) || 1000;
            
            // 添加奖励
            window.accountBalance += reward;
            
            console.log(`💰 钱包余额更新: +¥${reward}, 当前余额: ¥${window.accountBalance}`);
            
            // 调用主系统更新函数
            if (typeof updateAccountDisplay === 'function') {
                updateAccountDisplay();
            }
            
            if (typeof saveData === 'function') {
                saveData();
            }
            
            this.forceUpdateBalanceDisplay();
        } catch (error) {
            console.error('❌ 更新账户余额失败:', error);
        }
    },
    
    // 修复：强制刷新余额显示
    forceUpdateBalanceDisplay() {
        try {
            // 确保 window.accountBalance 是数字
            const balance = parseFloat(window.accountBalance) || 0;
            
            const balanceElement = document.getElementById('accountBalance');
            if (balanceElement) {
                balanceElement.textContent = `¥ ${balance.toFixed(2)}`;
                balanceElement.style.animation = 'none';
                balanceElement.offsetHeight; // 触发重排
                balanceElement.style.animation = 'balanceUpdate 0.6s ease-out';
                console.log('💰 余额显示已强制更新');
            }
            
            // 同时更新其他可能的余额显示元素
            const balanceElements = document.querySelectorAll('[data-balance], .account-balance, .balance-display');
            balanceElements.forEach(element => {
                if (element) {
                    element.textContent = `¥${balance.toFixed(2)}`;
                }
            });
            
        } catch (error) {
            console.error('❌ 强制更新余额显示失败:', error);
        }
    },
    
    // 更新签到数据
    updateCheckinData(dateStr, reward) {
        this.data.lastCheckinDate = dateStr;
        this.data.totalCheckins++;
        this.data.totalRewards += reward;
        this.updateStreakCount(dateStr);
        this.addCheckinRecord(dateStr, reward, Date.now());
        this.cleanOldRecords();
    },
    
    // 更新连续签到天数
    updateStreakCount(todayStr) {
        if (this.data.checkinHistory.length === 0) {
            this.data.checkinStreak = 1;
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = this.formatDate(yesterday);
        
        const lastRecord = this.data.checkinHistory[this.data.checkinHistory.length - 1];
        
        if (lastRecord && lastRecord.date === yesterdayStr) {
            this.data.checkinStreak++;
        } else {
            this.data.checkinStreak = 1;
        }
    },
    
    // 添加签到记录
    addCheckinRecord(dateStr, reward, timestamp) {
        this.data.checkinHistory.push({
            date: dateStr,
            reward: reward,
            timestamp: timestamp,
            version: this.config.version
        });
    },
    
    // 清理旧记录
    cleanOldRecords() {
        if (this.data.checkinHistory.length > this.config.maxRecords) {
            this.data.checkinHistory = this.data.checkinHistory.slice(-this.config.maxRecords);
        }
        if (this.data.makeupHistory && this.data.makeupHistory.length > this.config.maxRecords) {
            this.data.makeupHistory = this.data.makeupHistory.slice(-this.config.maxRecords);
        }
        if (this.data.transferHistory && this.data.transferHistory.length > this.config.maxRecords) {
            this.data.transferHistory = this.data.transferHistory.slice(-this.config.maxRecords);
        }
    },
    
    // 生成随机奖励
    generateReward() {
        const { minReward, maxReward } = this.config;
        const baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
        
        let bonus = 0;
        
        if (this.data.totalCheckins >= 360) {
            bonus += 10000;
        } else if (this.data.checkinStreak >= 30) {
            bonus += 1500;
        } else if (this.data.checkinStreak >= 7) {
            bonus += 800;
        } else if (this.data.checkinStreak >= 3) {
            bonus += 500;
        }
        
        const totalReward = baseReward + bonus;
        
        this.lastRewardDetails = {
            base: baseReward,
            bonus: bonus,
            total: totalReward,
            reason: this.getRewardReason()
        };
        
        return totalReward;
    },
    
    // 为补签生成基础奖励
    generateMakeupReward() {
        const { minReward, maxReward } = this.config;
        const baseReward = Math.floor(Math.random() * (maxReward - minReward + 1)) + minReward;
        const makeupReward = Math.floor(baseReward / 2);
        
        return {
            base: baseReward,
            makeup: makeupReward,
            reason: '补签基础奖励（减半）'
        };
    },
    
    // 获取奖励原因说明
    getRewardReason() {
        if (this.data.totalCheckins >= 360) {
            return `累计签到${this.data.totalCheckins}天，获得超级奖励！`;
        } else if (this.data.checkinStreak >= 30) {
            return `连续签到${this.data.checkinStreak}天，获得月度奖励！`;
        } else if (this.data.checkinStreak >= 7) {
            return `连续签到${this.data.checkinStreak}天，获得周度奖励！`;
        } else if (this.data.checkinStreak >= 3) {
            return `连续签到${this.data.checkinStreak}天，获得连续奖励！`;
        } else {
            return '每日基础签到奖励';
        }
    },
    
    // 获取可补签的日期列表
    getMissedDates() {
        const today = new Date();
        const missedDates = [];
        const maxDays = this.config.maxMakeupDays;
        
        for (let i = 1; i <= maxDays; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = this.formatDate(checkDate);
            
            const hasCheckedIn = this.data.checkinHistory.some(record => record.date === dateStr);
            const hasMadeUp = this.data.makeupHistory && this.data.makeupHistory.some(record => record.date === dateStr);
            
            if (!hasCheckedIn && !hasMadeUp) {
                missedDates.push({
                    date: dateStr,
                    dateObj: new Date(checkDate),
                    displayDate: `${checkDate.getMonth() + 1}月${checkDate.getDate()}日`
                });
            }
        }
        
        return missedDates.reverse();
    },
    
    // 补签功能
    makeupCheckin(targetDate) {
        try {
            console.log('🔄 开始补签:', targetDate);
            
            const today = new Date();
            const targetDateObj = new Date(targetDate);
            const daysDiff = Math.floor((today - targetDateObj) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 0) {
                this.showMessage('不能补签今天或未来的日期', 'error');
                return false;
            }
            
            if (daysDiff > this.config.maxMakeupDays) {
                this.showMessage(`只能补签最近${this.config.maxMakeupDays}天的记录`, 'error');
                return false;
            }
            
            const dateStr = this.formatDate(targetDateObj);
            const hasRecord = this.data.checkinHistory.some(record => record.date === dateStr) ||
                            (this.data.makeupHistory && this.data.makeupHistory.some(record => record.date === dateStr));
            
            if (hasRecord) {
                this.showMessage('该日期已经签到过了', 'info');
                return false;
            }
            
            const rewardInfo = this.generateMakeupReward();
            const makeupReward = rewardInfo.makeup;
            
            this.updateAccountBalance(makeupReward);
            
            if (!this.data.makeupHistory) {
                this.data.makeupHistory = [];
            }
            
            this.data.makeupHistory.push({
                date: dateStr,
                reward: makeupReward,
                baseReward: rewardInfo.base,
                timestamp: Date.now(),
                makeupDate: this.formatDate(today),
                type: 'makeup'
            });
            
            this.data.totalCheckins++;
            this.data.totalRewards += makeupReward;
            
            this.saveData();
            this.updateDisplay();
            this.showMakeupSuccess(makeupReward, rewardInfo.base, dateStr);
            
            console.log(`✅ 补签成功！日期: ${dateStr}, 补签奖励: ¥${makeupReward}`);
            return true;
            
        } catch (error) {
            console.error('❌ 补签失败:', error);
            this.showMessage('补签失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 🔥 转出到钱包功能
    transferToWallet(amount = 'all') {
        try {
            const availableAmount = this.getAvailableTransferAmount();
            
            if (availableAmount <= 0) {
                this.showMessage('暂无可转出金额', 'info');
                return false;
            }
            
            let transferAmount;
            
            if (amount === 'all') {
                transferAmount = availableAmount;
            } else {
                transferAmount = parseFloat(amount);
                
                if (isNaN(transferAmount) || transferAmount <= 0) {
                    this.showMessage('请输入有效的转出金额', 'error');
                    return false;
                }
                
                if (transferAmount > availableAmount) {
                    this.showMessage(`转出金额不能超过可用余额 ¥${availableAmount}`, 'error');
                    return false;
                }
            }
            
            // 更新钱包余额
            if (typeof window.accountBalance !== 'undefined') {
                window.accountBalance += transferAmount;
                
                // 调用主系统更新函数
                if (typeof updateAccountDisplay === 'function') {
                    updateAccountDisplay();
                }
                if (typeof saveData === 'function') {
                    saveData();
                }
            }
            
            // 记录转出历史
            this.addTransferRecord(transferAmount);
            
            // 保存数据
            this.saveData();
            
            // 更新显示
            this.updateDisplay();
            
            // 显示成功提示
            this.showMessage(`💰 转出成功！\n转出金额: ¥${transferAmount}\n当前钱包余额: ¥${window.accountBalance}`, 'success');
            
            console.log(`✅ 转出成功！金额: ¥${transferAmount}`);
            return true;
            
        } catch (error) {
            console.error('❌ 转出失败:', error);
            this.showMessage('转出失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 🔥 获取可转出金额
    getAvailableTransferAmount() {
        // 计算总收益减去已转出金额
        const totalTransferred = (this.data.transferHistory || []).reduce((sum, record) => 
            sum + (parseFloat(record.amount) || 0), 0
        );
        
        return Math.max(0, this.data.totalRewards - totalTransferred);
    },
    
    // 🔥 添加转出记录
    addTransferRecord(amount) {
        if (!this.data.transferHistory) {
            this.data.transferHistory = [];
        }
        
        const record = {
            amount: amount,
            timestamp: Date.now(),
            date: new Date().toLocaleDateString(),
            type: 'transfer'
        };
        
        this.data.transferHistory.unshift(record);
        
        // 限制历史记录数量
        if (this.data.transferHistory.length > 20) {
            this.data.transferHistory = this.data.transferHistory.slice(0, 20);
        }
    },
    
    // 🔥 显示部分转出对话框
    showTransferDialog() {
        const availableAmount = this.getAvailableTransferAmount();
        
        if (availableAmount <= 0) {
            this.showMessage('暂无可转出金额', 'info');
            return;
        }
        
        // 创建对话框
        const dialog = document.createElement('div');
        dialog.className = 'transfer-dialog';
        dialog.innerHTML = `
            <div class="transfer-dialog-content">
                <h3 class="dialog-title">💸 部分转出</h3>
                <div class="dialog-input-group">
                    <label class="dialog-label">可转出金额: ¥${availableAmount.toFixed(2)}</label>
                    <input type="number" class="dialog-input" id="transferAmountInput" 
                           placeholder="请输入转出金额" min="0.01" max="${availableAmount}" step="0.01">
                </div>
                <div class="dialog-actions">
                    <button class="dialog-btn cancel" onclick="this.closest('.transfer-dialog').remove()">取消</button>
                    <button class="dialog-btn confirm" onclick="CheckinModule.confirmPartialTransfer()">确认转出</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // 显示对话框
        setTimeout(() => {
            dialog.classList.add('show');
        }, 50);
        
        // 聚焦输入框
        setTimeout(() => {
            const input = dialog.querySelector('#transferAmountInput');
            if (input) {
                input.focus();
            }
        }, 300);
    },
    
    // 🔥 确认部分转出
    confirmPartialTransfer() {
        const input = document.getElementById('transferAmountInput');
        const dialog = document.querySelector('.transfer-dialog');
        
        if (input && dialog) {
            const amount = input.value;
            
            if (this.transferToWallet(amount)) {
                dialog.remove();
            }
        }
    },
    
    // 检查签到状态
    checkStatus() {
        const today = this.formatDate(new Date());
        const elements = this.getElements();
        
        if (!elements.btn) return;
        
        if (this.data.lastCheckinDate === today) {
            this.setCheckedInState(elements);
        } else {
            this.setCanCheckinState(elements);
        }
    },
    
    // 设置已签到状态
    setCheckedInState(elements) {
        if (elements.btn) {
            elements.btn.disabled = true;
            elements.btn.textContent = '✅ 今日已签到';
            elements.btn.classList.add('checked-in');
        }
        if (elements.icon) elements.icon.textContent = '✅';
        if (elements.title) elements.title.textContent = '今日已签到';
        if (elements.subtitle) elements.subtitle.textContent = '明天再来领取奖励吧';
    },
    
    // 设置可签到状态
    setCanCheckinState(elements) {
        if (elements.btn) {
            elements.btn.disabled = false;
            elements.btn.textContent = '🎁 立即签到';
            elements.btn.classList.remove('checked-in');
        }
        if (elements.icon) elements.icon.textContent = '📅';
        if (elements.title) elements.title.textContent = '今日签到';
        if (elements.subtitle) elements.subtitle.textContent = '签到获得随机余额奖励';
    },
    
    // 更新显示
    updateDisplay() {
        this.updateStats();
        this.updateRecords();
        this.updateMakeupDisplay();
        this.updateTransferDisplay();
    },
    
    // 更新统计数据
    updateStats() {
        const elements = this.getElements();
        
        if (elements.totalCheckins) {
            elements.totalCheckins.textContent = this.data.totalCheckins;
        }
        if (elements.checkinStreak) {
            elements.checkinStreak.textContent = this.data.checkinStreak;
        }
        if (elements.checkinRewards) {
            elements.checkinRewards.textContent = `¥${this.data.totalRewards}`;
        }
    },
    
    // 更新签到记录
    updateRecords() {
        const container = document.getElementById('checkinRecords');
        if (!container) return;
        
        const allRecords = [
            ...this.data.checkinHistory.map(r => ({...r, type: 'normal'})),
            ...(this.data.makeupHistory || []).map(r => ({...r, type: 'makeup'}))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (allRecords.length === 0) {
            container.innerHTML = '<div class="no-records">暂无签到记录</div>';
            return;
        }
        
        const recordsHtml = allRecords
            .slice(0, 10)
            .map(record => this.createRecordHtml(record))
            .join('');
        
        container.innerHTML = recordsHtml;
    },
    
        // 🔥 修复：补签功能（移除重复检查）
    makeupCheckin(targetDate) {
        try {
            console.log('🔄 开始补签:', targetDate);
            
            const today = new Date();
            const targetDateObj = new Date(targetDate);
            const daysDiff = Math.floor((today - targetDateObj) / (1000 * 60 * 60 * 24));
            
            // 验证补签条件
            if (daysDiff <= 0) {
                this.showMessage('不能补签今天或未来的日期', 'error');
                return false;
            }
            
            if (daysDiff > this.config.maxMakeupDays) {
                this.showMessage(`只能补签最近${this.config.maxMakeupDays}天的记录`, 'error');
                return false;
            }
            
            const dateStr = this.formatDate(targetDateObj);
            
            // 🔥 修复：移除重复签到检查，允许补签
            // 注释掉原来的检查逻辑
            /*
            const hasRecord = this.data.checkinHistory.some(record => record.date === dateStr) ||
                            (this.data.makeupHistory && this.data.makeupHistory.some(record => record.date === dateStr));
            
            if (hasRecord) {
                this.showMessage('该日期已经签到过了', 'info');
                return false;
            }
            */
            
            // 🔥 新逻辑：检查是否已经补签过这个日期
            const hasAlreadyMadeUp = this.data.makeupHistory && 
                this.data.makeupHistory.some(record => record.date === dateStr);
            
            if (hasAlreadyMadeUp) {
                this.showMessage(`${this.formatDisplayDate(targetDateObj)} 已经补签过了`, 'info');
                return false;
            }
            
            // 计算补签奖励（仅基础奖励的一半，无任何加成）
            const rewardInfo = this.generateMakeupReward();
            const makeupReward = rewardInfo.makeup;
            
            // 更新账户余额
            this.updateAccountBalance(makeupReward);
            
            // 确保makeupHistory数组存在
            if (!this.data.makeupHistory) {
                this.data.makeupHistory = [];
            }
            
            // 🔥 修复：添加补签记录，包含补签日期信息
            this.data.makeupHistory.push({
                date: dateStr,
                reward: makeupReward,
                baseReward: rewardInfo.base,
                timestamp: Date.now(),
                makeupDate: this.formatDate(today),
                makeupDisplayDate: this.formatDisplayDate(targetDateObj), // 新增：显示日期
                type: 'makeup'
            });
            
            // 更新统计数据（补签计入累计次数，但不影响连续签到）
            this.data.totalCheckins++;
            this.data.totalRewards += makeupReward;
            
            // 保存数据
            this.saveData();
            
            // 更新显示
            this.updateDisplay();
            
            // 🔥 修复：显示补签成功提示，明确显示补签日期
            this.showMakeupSuccess(makeupReward, rewardInfo.base, dateStr, targetDateObj);
            
            console.log(`✅ 补签成功！日期: ${dateStr}, 补签奖励: ¥${makeupReward}`);
            return true;
            
        } catch (error) {
            console.error('❌ 补签失败:', error);
            this.showMessage('补签失败，请稍后重试', 'error');
            return false;
        }
    },
    
    // 🔥 新增：格式化显示日期
    formatDisplayDate(dateObj) {
        return `${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
    },
    
    // 🔥 修复：显示补签成功提示
    showMakeupSuccess(makeupReward, baseReward, dateStr, targetDateObj) {
        const displayDate = this.formatDisplayDate(targetDateObj);
        const message = `🔄 补签成功！\n📅 补签日期: ${displayDate}\n💰 获得奖励: ¥${makeupReward}\n📝 基础奖励: ¥${baseReward} (补签减半)`;
        this.showMessage(message, 'success', 6000);
    },
    
    // 🔥 修复：创建记录HTML（区分类型，补签显示日期+后缀）
    createRecordHtml(record) {
        const date = new Date(record.timestamp);
        let dateStr, typeIcon, typeClass;
        
        if (record.type === 'makeup') {
            // 补签记录：显示补签的具体日期 + （补签）后缀
            const makeupDate = new Date(record.date);
            dateStr = `${makeupDate.getMonth() + 1}/${makeupDate.getDate()}（补签）`;
            typeIcon = '🔄';
            typeClass = 'makeup-record';
        } else {
            // 正常签到记录：显示签到当天日期
            dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
            typeIcon = '✅';
            typeClass = 'normal-record';
        }
        
        return `
            <div class="checkin-record-item ${typeClass}">
                <span class="record-date">${typeIcon} ${dateStr}</span>
                <span class="record-reward">+¥${record.reward}</span>
            </div>
        `;
    },
    
    // 🔥 修复：获取可补签的日期列表（不排除已签到的日期）
    getMissedDates() {
        const today = new Date();
        const missedDates = [];
        const maxDays = this.config.maxMakeupDays;
        
        for (let i = 1; i <= maxDays; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateStr = this.formatDate(checkDate);
            
            // 🔥 修复：只检查是否已经补签过，不检查是否已签到
            const hasMadeUp = this.data.makeupHistory && 
                this.data.makeupHistory.some(record => record.date === dateStr);
            
            if (!hasMadeUp) {
                missedDates.push({
                    date: dateStr,
                    dateObj: new Date(checkDate),
                    displayDate: `${checkDate.getMonth() + 1}月${checkDate.getDate()}日`
                });
            }
        }
        
        return missedDates.reverse(); // 按时间正序排列
    },
    
    // 🔥 完全修复：更新可补签日期显示
    updateMakeupDisplay() {
        const container = document.getElementById('missedDates');
        if (!container) {
            console.log('❌ 找不到补签容器元素 #missedDates');
            return;
        }
        
        const missedDates = this.getMissedDates();
        console.log('📅 可补签日期:', missedDates);
        
        if (missedDates.length === 0) {
            container.innerHTML = '<div class="no-missed">暂无可补签日期</div>';
            return;
        }
        
        // 清空容器
        container.innerHTML = '';
        
        // 创建补签提示
        const hintElement = document.createElement('div');
        hintElement.style.cssText = `
            text-align: center;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            margin-bottom: 10px;
            padding: 5px;
            background: rgba(255, 193, 7, 0.1);
            border-radius: 4px;
        `;
        hintElement.textContent = '💡 点击下方日期进行补签';
        container.appendChild(hintElement);
        
        // 为每个可补签日期创建元素
        missedDates.forEach((dateInfo, index) => {
            const minMakeup = Math.floor(this.config.minReward / 2);
            const maxMakeup = Math.floor(this.config.maxReward / 2);
            
            // 创建补签项目容器
            const dateElement = document.createElement('div');
            dateElement.className = 'missed-date-item';
            dateElement.setAttribute('data-date', dateInfo.date);
            dateElement.setAttribute('data-index', index);
            
            // 设置样式
            dateElement.style.cssText = `
                cursor: pointer;
                user-select: none;
                transition: all 0.3s ease;
                padding: 12px 16px;
                margin: 8px 0;
                background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
                border-radius: 10px;
                border: 2px solid rgba(255, 193, 7, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
                position: relative;
                overflow: hidden;
            `;
            
            // 创建内容
            dateElement.innerHTML = `
                <div style="display: flex; flex-direction: column;">
                    <span class="date-text" style="color: #ffc107; font-weight: bold; font-size: 14px;">${dateInfo.displayDate}</span>
                    <span style="color: rgba(255,255,255,0.7); font-size: 11px;">点击补签</span>
                </div>
                <div style="text-align: right;">
                    <span class="reward-text" style="color: #4caf50; font-weight: bold; font-size: 13px;">¥${minMakeup}-${maxMakeup}</span>
                    <div style="color: rgba(255,255,255,0.6); font-size: 10px;">补签奖励</div>
                </div>
                <div class="click-indicator" style="
                    position: absolute;
                    right: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    background: rgba(255, 193, 7, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                ">👆</div>
            `;
            
            // 🔥 关键修复：使用多种方式绑定点击事件
            
            // 方法1：addEventListener
            const clickHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log('🖱️ 补签点击事件触发:', dateInfo.displayDate, dateInfo.date);
                
                // 添加点击反馈
                dateElement.style.transform = 'scale(0.95)';
                dateElement.style.background = 'linear-gradient(135deg, rgba(255, 193, 7, 0.3), rgba(255, 152, 0, 0.3))';
                
                setTimeout(() => {
                    dateElement.style.transform = 'scale(1)';
                    dateElement.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))';
                }, 150);
                
                // 执行补签
                this.makeupCheckin(dateInfo.date);
            };
            
            dateElement.addEventListener('click', clickHandler);
            
            // 方法2：onclick属性（双重保险）
            dateElement.onclick = clickHandler;
            
            // 方法3：全局点击处理（三重保险）
            dateElement.setAttribute('onclick', `CheckinModule.makeupCheckin('${dateInfo.date}')`);
            
            // 悬停效果
            dateElement.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px) scale(1.02)';
                this.style.boxShadow = '0 8px 25px rgba(255, 193, 7, 0.4)';
                this.style.borderColor = 'rgba(255, 193, 7, 0.6)';
                
                const indicator = this.querySelector('.click-indicator');
                if (indicator) {
                    indicator.style.background = 'rgba(255, 193, 7, 0.5)';
                    indicator.style.transform = 'translateY(-50%) scale(1.2)';
                }
            });
            
            dateElement.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = '';
                this.style.borderColor = 'rgba(255, 193, 7, 0.3)';
                
                const indicator = this.querySelector('.click-indicator');
                if (indicator) {
                    indicator.style.background = 'rgba(255, 193, 7, 0.2)';
                    indicator.style.transform = 'translateY(-50%) scale(1)';
                }
            });
            
            // 添加到容器
            container.appendChild(dateElement);
        });
        
        // 🔥 额外保险：全局点击事件委托
        container.addEventListener('click', (e) => {
            const dateItem = e.target.closest('.missed-date-item');
            if (dateItem) {
                const date = dateItem.getAttribute('data-date');
                if (date) {
                    console.log('🔄 全局委托点击事件触发:', date);
                    this.makeupCheckin(date);
                }
            }
        });
        
        console.log('✅ 补签显示已更新，共', missedDates.length, '个可补签日期，多重点击事件已绑定');
        
        // 🔥 最终保险：延迟绑定
        setTimeout(() => {
            this.ensureMakeupClickable();
        }, 100);
    },
    
    // 🔥 新增：确保补签可点击
    ensureMakeupClickable() {
        const makeupItems = document.querySelectorAll('.missed-date-item');
        console.log('🔧 检查补签项目数量:', makeupItems.length);
        
        makeupItems.forEach((item, index) => {
            const date = item.getAttribute('data-date');
            if (date && !item.hasAttribute('data-click-ensured')) {
                item.setAttribute('data-click-ensured', 'true');
                
                // 强制绑定点击事件
                const forceClickHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🚀 强制点击事件触发:', date);
                    this.makeupCheckin(date);
                };
                
                item.removeEventListener('click', forceClickHandler);
                item.addEventListener('click', forceClickHandler);
                
                console.log(`✅ 补签项目 ${index + 1} 点击事件已确保绑定:`, date);
            }
        });
    },
    
    // 🔥 更新转出显示
    updateTransferDisplay() {
        const availableAmount = this.getAvailableTransferAmount();
        
        // 更新可转出金额显示
        const availableElement = document.getElementById('availableTransfer');
        if (availableElement) {
            availableElement.textContent = `¥${availableAmount.toFixed(2)}`;
        }
        
        // 更新按钮状态
        const transferAllBtn = document.getElementById('transferAllBtn');
        const transferPartialBtn = document.getElementById('transferPartialBtn');
        
        if (transferAllBtn) {
            transferAllBtn.disabled = availableAmount <= 0;
        }
        if (transferPartialBtn) {
            transferPartialBtn.disabled = availableAmount <= 0;
        }
        
        // 更新转出历史
        this.updateTransferHistory();
    },
    
    // 🔥 修复：更新转出历史显示
    updateTransferHistory() {
        const container = document.getElementById('transferHistory');
        if (!container) return;
        
        if (!this.data.transferHistory || this.data.transferHistory.length === 0) {
            container.innerHTML = '<div class="no-transfers">暂无转出记录</div>';
            return;
        }
        
        const historyHtml = this.data.transferHistory
            .slice(0, 5) // 显示最近5条
            .map(record => {
                const date = new Date(record.timestamp);
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                return `
                    <div class="transfer-record">
                        <span class="record-time">${timeStr}</span>
                        <span class="record-amount">-¥${record.amount}</span>
                    </div>
                `;
            })
            .join('');
        
        container.innerHTML = historyHtml;
    },
    
    // 创建记录HTML
    createRecordHtml(record) {
        const date = new Date(record.timestamp);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const typeIcon = record.type === 'makeup' ? '🔄' : '✅';
        const typeClass = record.type === 'makeup' ? 'makeup-record' : 'normal-record';
        
        return `
            <div class="checkin-record-item ${typeClass}">
                <span class="record-date">${typeIcon} ${dateStr}</span>
                <span class="record-reward">+¥${record.reward}</span>
            </div>
        `;
    },
    
    // 获取DOM元素
    getElements() {
        return {
            btn: document.getElementById('checkinBtn'),
            icon: document.getElementById('checkinIcon'),
            title: document.getElementById('checkinTitle'),
            subtitle: document.getElementById('checkinSubtitle'),
            totalCheckins: document.getElementById('totalCheckins'),
            checkinStreak: document.getElementById('checkinStreak'),
            checkinRewards: document.getElementById('checkinRewards')
        };
    },
    
    // 显示签到成功
    showSuccess(amount) {
        const card = document.querySelector('.checkin-card');
        if (card) {
            card.classList.add('checkin-success');
            setTimeout(() => card.classList.remove('checkin-success'), 800);
        }
        
        let message = `🎉 签到成功！获得 ¥${amount} 奖励`;
        if (this.lastRewardDetails && this.lastRewardDetails.bonus > 0) {
            message += `\n💰 基础奖励: ¥${this.lastRewardDetails.base}`;
            message += `\n🎁 额外奖励: ¥${this.lastRewardDetails.bonus}`;
            message += `\n📝 ${this.lastRewardDetails.reason}`;
        }
        
        this.showMessage(message, 'success');
    },
    
    // 显示补签成功提示
    showMakeupSuccess(makeupReward, baseReward, dateStr) {
        const date = new Date(dateStr);
        const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        const message = `🔄 补签成功！\n📅 ${displayDate} 补签完成\n💰 获得奖励: ¥${makeupReward}\n📝 原始奖励: ¥${baseReward} (补签减半)`;
        this.showMessage(message, 'success', 6000);
    },
    
    // 显示消息（内嵌式提示框）
    showMessage(message, type = 'info', duration = 5000) {
        if (!window.NotificationManager) {
            window.NotificationManager = {
                notifications: [],
                
                create(message, type, duration) {
                    const notification = document.createElement('div');
                    notification.className = `inline-notification ${type}`;
                    
                    const lines = message.split('\n');
                    const title = lines[0];
                    const content = lines.slice(1).join('\n');
                    
                    const icons = {
                        success: '✅',
                        error: '❌',
                        info: 'ℹ️',
                        warning: '⚠️'
                    };
                    
                    notification.innerHTML = `
                        <div class="notification-content">
                            <div class="notification-icon">${icons[type] || 'ℹ️'}</div>
                            <div class="notification-text">
                                <div class="notification-title">${title}</div>
                                ${content ? `<div class="notification-message">${content}</div>` : ''}
                            </div>
                        </div>
                        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
                        <div class="notification-progress">
                            <div class="notification-progress-bar"></div>
                        </div>
                    `;
                    
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        notification.classList.add('show');
                        const progressBar = notification.querySelector('.notification-progress-bar');
                        if (progressBar) {
                            progressBar.style.transitionDuration = `${duration}ms`;
                            progressBar.classList.add('animate');
                        }
                    }, 50);
                    
                    setTimeout(() => {
                        this.remove(notification);
                    }, duration);
                    
                    this.notifications.push(notification);
                    return notification;
                },
                
                remove(notification) {
                    if (notification && notification.parentElement) {
                        notification.classList.remove('show');
                        notification.classList.add('hide');
                        
                        setTimeout(() => {
                            if (notification.parentElement) {
                                notification.parentElement.removeChild(notification);
                            }
                            const index = this.notifications.indexOf(notification);
                            if (index > -1) {
                                this.notifications.splice(index, 1);
                            }
                        }, 400);
                    }
                },
                
                clear() {
                    this.notifications.forEach(notification => {
                        this.remove(notification);
                    });
                }
            };
        }
        
        window.NotificationManager.create(message, type, duration);
        console.log(`📢 [${type.toUpperCase()}] ${message}`);
    },
    
    // 播放音效
    playSound() {
        try {
            if (typeof window.audioManager !== 'undefined' && window.audioManager.playSequence) {
                const notes = [523.25, 659.25, 783.99, 1046.50];
                window.audioManager.playSequence(notes, 200, 0.15);
            }
        } catch (error) {
            console.log('🔇 音效播放失败:', error);
        }
    },
    
    // 格式化日期
    formatDate(date) {
        return date.toDateString();
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
            console.log('💾 签到数据已保存');
        } catch (error) {
            console.error('❌ 保存签到数据失败:', error);
        }
    },
    
    // 加载数据
    loadData() {
        try {
            const saved = localStorage.getItem(this.config.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.data = {
                    lastCheckinDate: parsed.lastCheckinDate || null,
                    totalCheckins: parsed.totalCheckins || 0,
                    checkinStreak: parsed.checkinStreak || 0,
                    totalRewards: parsed.totalRewards || 0,
                    checkinHistory: parsed.checkinHistory || [],
                    makeupHistory: parsed.makeupHistory || [],
                    transferHistory: parsed.transferHistory || [],
                    version: this.config.version
                };
                
                this.validateData();
                console.log('📂 签到数据已加载');
            }
        } catch (error) {
            console.error('❌ 加载签到数据失败:', error);
            this.resetData();
        }
    },
    
    // 验证数据完整性
    validateData() {
        this.data.totalCheckins = Math.max(0, parseInt(this.data.totalCheckins) || 0);
        this.data.checkinStreak = Math.max(0, parseInt(this.data.checkinStreak) || 0);
        this.data.totalRewards = Math.max(0, parseFloat(this.data.totalRewards) || 0);
        
        if (!Array.isArray(this.data.checkinHistory)) this.data.checkinHistory = [];
        if (!Array.isArray(this.data.makeupHistory)) this.data.makeupHistory = [];
        if (!Array.isArray(this.data.transferHistory)) this.data.transferHistory = [];
        
        this.data.checkinHistory = this.data.checkinHistory.filter(record => 
            record && record.date && record.reward && record.timestamp
        );
        this.data.makeupHistory = this.data.makeupHistory.filter(record => 
            record && record.date && record.reward && record.timestamp
        );
        this.data.transferHistory = this.data.transferHistory.filter(record => 
            record && record.amount && record.timestamp
        );
        
        this.recalculateStats();
    },
    
    // 重新计算统计数据
    recalculateStats() {
        const totalRecords = this.data.checkinHistory.length + (this.data.makeupHistory ? this.data.makeupHistory.length : 0);
        if (totalRecords === 0) return;
        
        this.data.totalCheckins = totalRecords;
        
        const checkinRewards = this.data.checkinHistory.reduce((sum, record) => 
            sum + (parseFloat(record.reward) || 0), 0
        );
        const makeupRewards = (this.data.makeupHistory || []).reduce((sum, record) => 
            sum + (parseFloat(record.reward) || 0), 0
        );
        this.data.totalRewards = checkinRewards + makeupRewards;
    },
    
    // 重置数据
    resetData() {
        this.data = {
            lastCheckinDate: null,
            totalCheckins: 0,
            checkinStreak: 0,
            totalRewards: 0,
            checkinHistory: [],
            makeupHistory: [],
            transferHistory: [],
            version: this.config.version
        };
    },
    
    // 获取签到统计
    getStats() {
        return {
            totalCheckins: this.data.totalCheckins,
            checkinStreak: this.data.checkinStreak,
            totalRewards: this.data.totalRewards,
            canCheckinToday: this.data.lastCheckinDate !== this.formatDate(new Date()),
            lastCheckinDate: this.data.lastCheckinDate,
            missedDates: this.getMissedDates().length,
            makeupHistory: this.data.makeupHistory || [],
            transferHistory: this.data.transferHistory || [],
            availableTransfer: this.getAvailableTransferAmount()
        };
    },
    
    // 导出数据
    exportData() {
        return {
            ...this.data,
            exportTime: Date.now(),
            version: this.config.version
        };
    },
    
    // 导入数据
    importData(importedData) {
        try {
            if (importedData && typeof importedData === 'object') {
                this.data = {
                    lastCheckinDate: importedData.lastCheckinDate || null,
                    totalCheckins: importedData.totalCheckins || 0,
                    checkinStreak: importedData.checkinStreak || 0,
                    totalRewards: importedData.totalRewards || 0,
                    checkinHistory: importedData.checkinHistory || [],
                    makeupHistory: importedData.makeupHistory || [],
                    transferHistory: importedData.transferHistory || [],
                    version: this.config.version
                };
                this.validateData();
                this.saveData();
                this.updateDisplay();
                this.checkStatus();
                return true;
            }
        } catch (error) {
            console.error('❌ 导入数据失败:', error);
        }
        return false;
    }
};

// 全局函数，供HTML调用
function dailyCheckin() {
    return CheckinModule.checkin();
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CheckinModule.init();
    });
} else {
    CheckinModule.init();
}

// 导出模块供其他脚本使用
if (typeof window !== 'undefined') {
    window.CheckinModule = CheckinModule;
}

// 调试工具
if (typeof window !== 'undefined') {
    window.debugCheckin = {
        getStats: () => CheckinModule.getStats(),
        exportData: () => CheckinModule.exportData(),
        importData: (data) => CheckinModule.importData(data),
        resetData: () => {
            CheckinModule.resetData();
            CheckinModule.saveData();
            CheckinModule.updateDisplay();
            CheckinModule.checkStatus();
            console.log('✅ 签到数据已重置');
        },
        forceCheckin: () => {
            CheckinModule.data.lastCheckinDate = null;
            return CheckinModule.checkin();
        },
        forceMakeup: (date) => {
            return CheckinModule.makeupCheckin(date);
        },
        testMakeup: () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = CheckinModule.formatDate(yesterday);
            console.log('测试补签日期:', dateStr);
            return CheckinModule.makeupCheckin(dateStr);
        },
        getMissedDates: () => {
            const missed = CheckinModule.getMissedDates();
            console.log('可补签日期:', missed);
            return missed;
        },
        refreshMakeup: () => {
            CheckinModule.updateMakeupDisplay();
            console.log('✅ 补签显示已刷新');
        },
        clearYesterday: () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const dateStr = CheckinModule.formatDate(yesterday);
            
            CheckinModule.data.checkinHistory = CheckinModule.data.checkinHistory.filter(
                record => record.date !== dateStr
            );
            CheckinModule.data.makeupHistory = CheckinModule.data.makeupHistory.filter(
                record => record.date !== dateStr
            );
            
            CheckinModule.saveData();
            CheckinModule.updateDisplay();
            console.log('✅ 已清除昨天的签到记录，可以测试补签功能');
        },
        testNotifications: () => {
            CheckinModule.showMessage('这是一个成功通知\n包含多行内容', 'success');
            setTimeout(() => CheckinModule.showMessage('这是一个信息通知', 'info'), 1000);
            setTimeout(() => CheckinModule.showMessage('这是一个警告通知\n请注意相关事项', 'warning'), 2000);
            setTimeout(() => CheckinModule.showMessage('这是一个错误通知', 'error'), 3000);
        },
        clearNotifications: () => {
            if (window.NotificationManager) {
                window.NotificationManager.clear();
                console.log('✅ 所有通知已清除');
            }
        },
        getTransferInfo: () => {
            return {
                totalRewards: CheckinModule.data.totalRewards,
                transferHistory: CheckinModule.data.transferHistory,
                availableAmount: CheckinModule.getAvailableTransferAmount(),
                walletBalance: window.accountBalance || 0
            };
        },
        testTransfer: (amount = 100) => {
            return CheckinModule.transferToWallet(amount);
        },
        resetTransfers: () => {
            CheckinModule.data.transferHistory = [];
            CheckinModule.saveData();
            CheckinModule.updateDisplay();
            console.log('✅ 转出记录已重置');
        }
    };
}

console.log('🎯 签到模块加载完成 v2.0.0 - 完全重构版');