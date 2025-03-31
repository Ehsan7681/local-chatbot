document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const helpBtn = document.getElementById('helpBtn');
    const historyBtn = document.getElementById('historyBtn');
    const settingsPanel = document.getElementById('settingsPanel');
    const helpPanel = document.getElementById('helpPanel');
    const historyPanel = document.getElementById('historyPanel');
    const historyList = document.getElementById('historyList');
    const newChatBtn = document.getElementById('newChatBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const closeHelpBtn = document.getElementById('closeHelpBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const testConnectionBtn = document.getElementById('testConnectionBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const statusBar = document.getElementById('statusBar');
    const connectionStatus = document.getElementById('connectionStatus');
    const panelOverlay = document.getElementById('panelOverlay');
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // مخفی کردن نوار وضعیت در ابتدا
    statusBar.style.display = 'none';
    
    // تاریخچه گفتگوها
    let chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
    
    // چت فعلی
    let activeChatId = localStorage.getItem('activeChatId');
    
    // مقدار اولیه چت
    const initialChatMessage = {
        role: 'user',
        content: ''
    };
    
    const initialBotResponse = {
        role: 'assistant',
        content: ''
    };
    
    // ایجاد چت جدید اگر هیچ چتی وجود ندارد یا چت فعال نیست
    if (chatSessions.length === 0 || !activeChatId) {
        createNewChat();
    }
    
    // Chat history - try to load from active chat session
    let chatHistory = [];
    
    // Load active chat
    loadActiveChat();
    
    // Settings
    let settings = {
        apiUrl: localStorage.getItem('apiUrl') || 'http://localhost:1234/v1/chat/completions',
        temperature: parseFloat(localStorage.getItem('temperature') || 0.7),
        maxTokens: parseInt(localStorage.getItem('maxTokens') || 1024),
        systemPrompt: localStorage.getItem('systemPrompt') || 'شما یک دستیار مفید، خلاق و دقیق هستید.',
        darkMode: localStorage.getItem('darkMode') === 'true' // تنظیمات تم تیره
    };
    
    // اعمال تم تیره اگر در تنظیمات فعال باشد
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        if (darkModeToggle) {
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
    
    // آرایه پرامپت‌های قبلی
    let previousPrompts = JSON.parse(localStorage.getItem('previousPrompts') || '[]');
    
    // حداکثر تعداد پرامپت‌های ذخیره شده
    const MAX_STORED_PROMPTS = 10;
    
    // Function to save chat sessions to localStorage
    function saveChatSessions() {
        localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
        localStorage.setItem('activeChatId', activeChatId);
    }
    
    // تغییر تم تیره/روشن
    darkModeToggle.addEventListener('click', () => {
        toggleDarkMode(!document.body.classList.contains('dark-mode'));
    });
    
    // تابع تغییر تم تیره
    function toggleDarkMode(enable) {
        if (enable) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
        
        // ذخیره تنظیمات در localStorage
        localStorage.setItem('darkMode', enable);
        settings.darkMode = enable;
        
        // به‌روزرسانی چک باکس در تنظیمات اگر موجود باشد
        const darkModeCheckbox = document.getElementById('darkModeCheckbox');
        if (darkModeCheckbox) {
            darkModeCheckbox.checked = enable;
        }
    }
    
    // Function to save current chat history to active session
    function saveCurrentChat() {
        if (!activeChatId) return;
        
        const sessionIndex = chatSessions.findIndex(s => s.id === activeChatId);
        if (sessionIndex !== -1) {
            // کپی عمیق از تاریخچه چت
            chatSessions[sessionIndex].messages = JSON.parse(JSON.stringify(chatHistory));
            chatSessions[sessionIndex].lastUpdated = new Date().toISOString();
            
            if (chatHistory.length >= 2) {
                // استخراج عنوان از اولین پیام کاربر
                const firstUserMessage = chatHistory.find(msg => msg.role === 'user');
                if (firstUserMessage) {
                    // حداکثر 30 کاراکتر از پیام اول به عنوان عنوان چت
                    const title = firstUserMessage.content.substring(0, 30) + 
                        (firstUserMessage.content.length > 30 ? '...' : '');
                    chatSessions[sessionIndex].title = title || 'گفتگوی جدید';
                }
            }
            
            // ذخیره در localStorage
            saveChatSessions();
            console.log(`تاریخچه چت (${chatHistory.length} پیام) ذخیره شد`);
        }
    }
    
    // Function to create new chat
    function createNewChat() {
        const newChat = {
            id: 'chat_' + Date.now(),
            title: 'گفتگوی جدید',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            messages: [] // حذف پیام‌های پیش‌فرض
        };
        
        chatSessions.unshift(newChat); // اضافه کردن به ابتدای آرایه
        activeChatId = newChat.id;
        
        saveChatSessions();
        loadActiveChat();
        refreshHistoryList();
    }
    
    // Function to load active chat with full history
    function loadActiveChat() {
        // پیدا کردن چت فعال
        const activeChat = chatSessions.find(session => session.id === activeChatId);
        
        if (activeChat) {
            console.log(`بارگذاری چت فعال با شناسه ${activeChatId} (${activeChat.messages.length} پیام)`);
            // کپی عمیق از پیام‌های چت فعال
            chatHistory = JSON.parse(JSON.stringify(activeChat.messages));
            // بارگذاری پیام‌ها در رابط کاربری
            loadChatHistoryToUI();
        } else if (chatSessions.length > 0) {
            // اگر چت فعال وجود ندارد، اولین چت را فعال کنید
            activeChatId = chatSessions[0].id;
            console.log(`چت فعال پیدا نشد، اولین چت با شناسه ${activeChatId} بارگذاری شد`);
            chatHistory = JSON.parse(JSON.stringify(chatSessions[0].messages));
            loadChatHistoryToUI();
        } else {
            // اگر هیچ چتی وجود ندارد، یک چت جدید ایجاد کنید
            console.log('هیچ چتی یافت نشد، ایجاد چت جدید');
            createNewChat();
        }
        
        // به روزرسانی تاریخچه در رابط کاربری
        refreshHistoryList();
    }
    
    // Function to refresh history list in UI
    function refreshHistoryList() {
        historyList.innerHTML = '';
        
        chatSessions.forEach(session => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            if (session.id === activeChatId) {
                historyItem.classList.add('active');
            }
            historyItem.dataset.chatId = session.id;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'history-item-content';
            
            const dateElement = document.createElement('div');
            dateElement.className = 'history-item-date';
            
            // تبدیل تاریخ به فرمت مناسب فارسی
            const date = new Date(session.lastUpdated);
            const formattedDate = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
            
            dateElement.textContent = formattedDate;
            
            const titleElement = document.createElement('div');
            titleElement.className = 'history-item-title';
            titleElement.textContent = session.title;
            
            contentDiv.appendChild(dateElement);
            contentDiv.appendChild(titleElement);
            
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-item-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'history-action-btn edit-btn';
            editBtn.innerHTML = '<i class="fas fa-edit"></i>';
            editBtn.title = 'ویرایش عنوان';
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editChatTitle(session.id);
            });
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'history-action-btn delete-btn';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.title = 'حذف گفتگو';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(session.id);
            });
            
            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            
            historyItem.appendChild(contentDiv);
            historyItem.appendChild(actionsDiv);
            
            // لود کردن چت هنگام کلیک روی آیتم
            historyItem.addEventListener('click', () => {
                activeChatId = session.id;
                saveChatSessions();
                loadActiveChat();
            });
            
            historyList.appendChild(historyItem);
        });
    }
    
    // Function to edit chat title
    function editChatTitle(chatId) {
        const sessionIndex = chatSessions.findIndex(s => s.id === chatId);
        if (sessionIndex === -1) return;
        
        const newTitle = prompt('عنوان جدید را وارد کنید:', chatSessions[sessionIndex].title);
        if (newTitle !== null && newTitle.trim() !== '') {
            chatSessions[sessionIndex].title = newTitle.trim();
            saveChatSessions();
            refreshHistoryList();
        }
    }
    
    // Function to delete chat
    function deleteChat(chatId) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این گفتگو را حذف کنید؟')) return;
        
        const sessionIndex = chatSessions.findIndex(s => s.id === chatId);
        if (sessionIndex === -1) return;
        
        chatSessions.splice(sessionIndex, 1);
        
        // اگر چت فعال حذف شد، چت جدید را فعال کنید
        if (chatId === activeChatId) {
            if (chatSessions.length > 0) {
                activeChatId = chatSessions[0].id;
                loadActiveChat();
            } else {
                createNewChat();
            }
        }
        
        saveChatSessions();
        refreshHistoryList();
    }
    
    // Function to save chat history to localStorage
    function saveChatHistory() {
        saveCurrentChat();
    }
    
    // Load settings
    function loadSettings() {
        document.getElementById('apiUrl').value = settings.apiUrl;
        temperatureSlider.value = settings.temperature;
        temperatureValue.textContent = settings.temperature;
        document.getElementById('maxTokens').value = settings.maxTokens;
        document.getElementById('systemPrompt').value = settings.systemPrompt;
        
        // اضافه کردن چک باکس حالت تیره به پنل تنظیمات
        if (!document.getElementById('darkModeCheckbox')) {
            const darkModeRow = document.createElement('div');
            darkModeRow.className = 'setting-group';
            
            const darkModeLabel = document.createElement('label');
            darkModeLabel.textContent = 'حالت تیره:';
            darkModeLabel.htmlFor = 'darkModeCheckbox';
            
            const darkModeCheckbox = document.createElement('input');
            darkModeCheckbox.type = 'checkbox';
            darkModeCheckbox.id = 'darkModeCheckbox';
            darkModeCheckbox.checked = settings.darkMode;
            
            darkModeRow.appendChild(darkModeLabel);
            darkModeRow.appendChild(darkModeCheckbox);
            
            // پیدا کردن محل مناسب برای افزودن گزینه تم تیره
            const settingsContent = document.querySelector('.settings-content');
            if (settingsContent) {
                settingsContent.appendChild(darkModeRow);
            }
        } else {
            document.getElementById('darkModeCheckbox').checked = settings.darkMode;
        }
    }
    
    // Save settings
    function saveSettings() {
        const newPrompt = document.getElementById('systemPrompt').value;
        
        settings.apiUrl = document.getElementById('apiUrl').value;
        settings.temperature = parseFloat(temperatureSlider.value);
        settings.maxTokens = parseInt(document.getElementById('maxTokens').value);
        settings.systemPrompt = newPrompt;
        
        // ذخیره تنظیمات تم تیره - به‌روزرسانی نحوه اعمال تغییرات
        const darkModeCheckbox = document.getElementById('darkModeCheckbox');
        if (darkModeCheckbox) {
            const isDarkMode = darkModeCheckbox.checked;
            settings.darkMode = isDarkMode;
            localStorage.setItem('darkMode', isDarkMode);
            
            // اعمال مستقیم تغییرات به جای استفاده از تابع
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            } else {
                document.body.classList.remove('dark-mode');
                darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            }
        }
        
        localStorage.setItem('apiUrl', settings.apiUrl);
        localStorage.setItem('temperature', settings.temperature);
        localStorage.setItem('maxTokens', settings.maxTokens);
        localStorage.setItem('systemPrompt', settings.systemPrompt);
        
        // اضافه کردن پرامپت به لیست پرامپت‌های قبلی
        if (newPrompt.trim() !== '' && !previousPrompts.includes(newPrompt)) {
            previousPrompts.unshift(newPrompt); // اضافه کردن به ابتدای آرایه
            
            // محدود کردن تعداد پرامپت‌ها به حداکثر تعداد مشخص شده
            if (previousPrompts.length > MAX_STORED_PROMPTS) {
                previousPrompts = previousPrompts.slice(0, MAX_STORED_PROMPTS);
            }
            
            localStorage.setItem('previousPrompts', JSON.stringify(previousPrompts));
        }
        
        // ابتدا تغییرات تم و تنظیمات اعمال شوند، سپس پنل بسته شود
        setTimeout(() => {
            settingsPanel.classList.remove('show');
            panelOverlay.classList.remove('show');
            
            // بررسی اتصال با تنظیمات جدید
            checkLMStudioConnection();
        }, 100);
    }
    
    // تابع نمایش پرامپت‌های قبلی
    function showPreviousPrompts() {
        // بررسی و حذف پنل و اورلی قبلی اگر وجود داشته باشد
        const existingPanel = document.getElementById('previousPromptsPanel');
        const existingOverlay = document.getElementById('promptsPanelOverlay');
        
        if (existingPanel) {
            existingPanel.remove();
        }
        
        if (existingOverlay) {
            existingOverlay.remove();
        }
        
        // بررسی وجود پرامپت‌های قبلی
        if (previousPrompts.length === 0) {
            alert('هیچ پرامپت قبلی ذخیره نشده است.');
            return;
        }
        
        // ایجاد پنل نمایش پرامپت‌های قبلی
        const promptsPanel = document.createElement('div');
        promptsPanel.className = 'settings-panel previous-prompts-panel show'; // اضافه کردن کلاس show برای نمایش پنل
        promptsPanel.id = 'previousPromptsPanel';
        
        // هدر پنل
        const panelHeader = document.createElement('div');
        panelHeader.className = 'settings-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = 'پرامپت‌های قبلی';
        
        const closeButton = document.createElement('div');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.onclick = () => closePromptsPanel();
        
        panelHeader.appendChild(headerTitle);
        panelHeader.appendChild(closeButton);
        
        // محتوای پنل
        const panelContent = document.createElement('div');
        panelContent.className = 'settings-content';
        
        // لیست پرامپت‌ها
        previousPrompts.forEach((prompt, index) => {
            const promptItem = document.createElement('div');
            promptItem.className = 'previous-prompt-item';
            
            const promptNumber = document.createElement('div');
            promptNumber.className = 'previous-prompt-number';
            promptNumber.textContent = `پرامپت #${index + 1}`;
            
            const promptContent = document.createElement('div');
            promptContent.className = 'previous-prompt-content';
            promptContent.textContent = prompt;
            
            const useButton = document.createElement('button');
            useButton.className = 'btn-save previous-prompt-use';
            useButton.textContent = 'استفاده از این پرامپت';
            useButton.onclick = () => {
                // پر کردن فیلد پرامپت با پرامپت انتخاب شده
                document.getElementById('systemPrompt').value = prompt;
                
                // بستن پنل
                closePromptsPanel();
            };
            
            const deleteButton = document.createElement('button');
            deleteButton.className = 'btn-danger previous-prompt-delete';
            deleteButton.textContent = 'حذف';
            deleteButton.onclick = () => {
                // حذف پرامپت از آرایه
                previousPrompts.splice(index, 1);
                localStorage.setItem('previousPrompts', JSON.stringify(previousPrompts));
                
                // حذف آیتم از نمایش
                promptItem.remove();
                
                // اگر هیچ پرامپتی باقی نماند، پنل را ببندیم
                if (previousPrompts.length === 0) {
                    closePromptsPanel();
                }
            };
            
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'previous-prompt-buttons';
            buttonsContainer.appendChild(useButton);
            buttonsContainer.appendChild(deleteButton);
            
            promptItem.appendChild(promptNumber);
            promptItem.appendChild(promptContent);
            promptItem.appendChild(buttonsContainer);
            
            panelContent.appendChild(promptItem);
        });
        
        promptsPanel.appendChild(panelHeader);
        promptsPanel.appendChild(panelContent);
        
        // ایجاد overlay
        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay show';
        overlay.id = 'promptsPanelOverlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closePromptsPanel();
            }
        };
        
        // افزودن به DOM
        document.body.appendChild(overlay);
        document.body.appendChild(promptsPanel);
        
        console.log('پنل پرامپت‌های قبلی با موفقیت نمایش داده شد.');
    }
    
    // تابع بستن پنل پرامپت‌های قبلی
    function closePromptsPanel() {
        const promptsPanel = document.getElementById('previousPromptsPanel');
        const overlay = document.getElementById('promptsPanelOverlay');
        
        if (promptsPanel) {
            promptsPanel.remove();
        }
        
        if (overlay) {
            overlay.remove();
        }
    }
    
    // Update connection status
    function updateConnectionStatus(status, isSuccess = false, isError = false, isStreaming = false) {
        // متغیر جهانی برای نگهداری تایمر
        if (window.statusTimer) {
            clearTimeout(window.statusTimer);
            window.statusTimer = null;
        }
        
        if (!status || status === '') {
            // اگر پیام خالی باشد، نوار وضعیت را مخفی کن
            statusBar.style.display = 'none';
            return;
        }
        
        // اطمینان از اینکه والد نوار وضعیت position: relative دارد
        document.querySelector('.chat-container').style.position = 'relative';
        
        // نمایش نوار وضعیت
        statusBar.style.display = 'inline-flex';
        connectionStatus.textContent = status;
        statusBar.className = 'status-bar';
        
        // اگر در حال دریافت استریم هستیم، کلاس streaming را اضافه کنیم
        if (isStreaming) {
            statusBar.classList.add('streaming');
            // در حالت استریم نباید تایمر مخفی‌سازی فعال شود
            return;
        }
        
        if (isSuccess) {
            statusBar.classList.add('success');
            
            // بعد از 5 ثانیه نوار وضعیت کاملاً مخفی شود
            window.statusTimer = setTimeout(() => {
                statusBar.style.display = 'none';
            }, 5000);
            
        } else if (isError) {
            statusBar.classList.add('error');
            
            // حتی پیام‌های خطا هم بعد از 10 ثانیه مخفی شوند
            window.statusTimer = setTimeout(() => {
                statusBar.style.display = 'none';
            }, 10000);
            
        } else {
            // برای پیام‌های عادی، بعد از 5 ثانیه مخفی شوند
            window.statusTimer = setTimeout(() => {
                statusBar.style.display = 'none';
            }, 5000);
        }
    }
    
    // Auto resize textarea
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    }
    
    // Load chat history to UI
    function loadChatHistoryToUI() {
        // پاک کردن همه پیام‌های فعلی
        chatMessages.innerHTML = '';
        
        // اضافه کردن پیام خوش‌آمدگویی
        addWelcomeMessage();
        
        console.log(`نمایش ${chatHistory.length} پیام در رابط کاربری`);
        
        // افزودن تمام پیام‌ها از تاریخچه چت
        chatHistory.forEach((message, index) => {
            if (message.role === 'user') {
                addMessage(message.content, true);
            } else if (message.role === 'assistant') {
                // بررسی کنیم که آیا این پیام خطاست یا خیر
                const isError = message.content.includes('خطا') || 
                                message.content.includes('اتصال') || 
                                message.content.includes('متأسفانه');
                addMessage(message.content, false, isError);
            }
        });
        
        // پنهان کردن پیام خوش‌آمدگویی اگر پیامی وجود دارد
        if (chatHistory.length > 0) {
            hideWelcomeMessage();
        }
        
        // حذف اسکرول خودکار به پایین صفحه
        // setTimeout(() => {
        //     chatMessages.scrollTop = chatMessages.scrollHeight;
        // }, 100);
    }
    
    // اضافه کردن پیام خوش‌آمدگویی
    function addWelcomeMessage() {
        const welcomeHTML = `
            <div id="welcomeMessage" class="welcome-message">
                <div>
                    <i class="fas fa-robot welcome-icon"></i>
                    <h2>به چت‌بات محلی خوش آمدید</h2>
                    <p>پیام خود را بنویسید تا گفتگو را شروع کنیم...</p>
                </div>
            </div>
        `;
        
        // مطمئن شویم که container چت خالی است
        if (chatMessages.children.length === 0) {
            // اول مطمئن شویم container چت position: relative دارد
            chatMessages.style.position = 'relative';
            
            // اضافه کردن پیام خوش‌آمدگویی به DOM
            chatMessages.insertAdjacentHTML('beforeend', welcomeHTML);
        }
    }
    
    // پنهان کردن پیام خوش‌آمدگویی
    function hideWelcomeMessage() {
        const welcomeMessage = document.getElementById('welcomeMessage');
        if (welcomeMessage) {
            welcomeMessage.classList.add('hidden');
            
            // حذف المان پس از پایان انیمیشن
            setTimeout(() => {
                welcomeMessage.remove();
            }, 500);
        }
    }
    
    // تابع تخمین تعداد توکن‌ها (تقریبی)
    function estimateTokens(text) {
        // تخمین ساده برای زبان فارسی: هر 4 کاراکتر حدود 1 توکن (این یک تخمین تقریبی است)
        return Math.ceil(text.length / 4);
    }
    
    // تابع شمارش کلمات
    function countWords(text) {
        // حذف کدهای مارک‌داون
        const cleanText = text.replace(/```[\s\S]*?```/g, '')
                            .replace(/`.*?`/g, '')
                            .replace(/\*\*.*?\*\*/g, '')
                            .replace(/\*.*?\*/g, '')
                            .replace(/#+ /g, '')
                            .trim();
                            
        // تقسیم متن به کلمات با استفاده از فاصله و نشانه‌های نقطه‌گذاری
        const words = cleanText.split(/[\s\u200c]+/).filter(word => word.length > 0);
        return words.length;
    }
    
    // Add message to chat
    function addMessage(content, isUser = false, isError = false) {
        const messageDiv = document.createElement('div');
        let className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        if (isError && !isUser) {
            className += ' error-message';
        }
        messageDiv.className = className;
        
        // ایجاد یک آیدی یکتا برای هر پیام
        const messageId = 'msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        messageDiv.id = messageId;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        const avatarIcon = document.createElement('i');
        avatarIcon.className = isUser ? 'fas fa-user' : 'fas fa-robot';
        avatar.appendChild(avatarIcon);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // پردازش و تشخیص بلوک‌های کد
        let processedContent = processCodeBlocks(content);
        messageContent.innerHTML = processedContent;
        
        // اضافه کردن دکمه‌های عملیات
        const actionButtons = document.createElement('div');
        actionButtons.className = 'message-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'action-btn copy-btn';
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.title = 'کپی پیام';
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(content).then(() => {
                updateConnectionStatus('پیام با موفقیت کپی شد', true);
            });
        });
        
        actionButtons.appendChild(copyBtn);
        
        if (isUser) {
            // دکمه ویرایش
            const editButton = document.createElement('button');
            editButton.className = 'action-btn edit-btn';
            editButton.innerHTML = '<i class="fas fa-edit"></i>';
            editButton.title = 'ویرایش پیام';
            editButton.onclick = () => editMessage(messageId, content, isUser);
            
            // دکمه حذف
            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = 'حذف پیام';
            deleteButton.onclick = () => deleteMessage(messageId, isUser);
            
            // افزودن دکمه‌ها به باکس عملیات
            actionButtons.appendChild(editButton);
            actionButtons.appendChild(deleteButton);
        } else {
            // دکمه‌ها برای پیام‌های هوش مصنوعی
            if (!isError) {
                // دکمه تکرار پاسخ
                const regenerateButton = document.createElement('button');
                regenerateButton.className = 'action-btn regenerate-btn';
                regenerateButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
                regenerateButton.title = 'تکرار پاسخ';
                regenerateButton.onclick = () => regenerateAnswer(messageId);
                
                // شمارشگر تکرار
                const countBadge = document.createElement('span');
                countBadge.className = 'regenerate-count';
                countBadge.textContent = '0';
                countBadge.style.display = 'none';
                
                // دکمه نمایش پاسخ‌های قبلی
                const historyButton = document.createElement('button');
                historyButton.className = 'action-btn previous-answers-btn';
                historyButton.innerHTML = '<i class="fas fa-history"></i>';
                historyButton.title = 'نمایش پاسخ‌های قبلی';
                historyButton.onclick = () => showPreviousAnswers(messageId);
                historyButton.style.display = 'none';
                
                // ذخیره اطلاعات مورد نیاز برای تکرار پاسخ
                messageDiv.dataset.regenerateCount = '0';
                messageDiv.dataset.answers = JSON.stringify([{
                    content: content,
                    timestamp: new Date().toISOString()
                }]);
                
                actionButtons.appendChild(regenerateButton);
                actionButtons.appendChild(countBadge);
                actionButtons.appendChild(historyButton);
            }
            
            // دکمه حذف
            const deleteButton = document.createElement('button');
            deleteButton.className = 'action-btn delete-btn';
            deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
            deleteButton.title = 'حذف پیام';
            deleteButton.onclick = () => deleteMessage(messageId, isUser);
            
            actionButtons.appendChild(deleteButton);
        }
        
        // افزودن زیرنویس آمار پیام
        const messageStats = document.createElement('div');
        messageStats.className = 'message-stats';
        
        // محاسبه تعداد کلمات و توکن‌ها
        const wordCount = countWords(content);
        const tokenCount = estimateTokens(content);
        
        // نمایش تاریخ و زمان فعلی
        const now = new Date();
        const timeString = new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(now);
        
        messageStats.innerHTML = `<span>${wordCount} کلمه</span> | <span>${tokenCount} توکن</span> | <span>${timeString}</span>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(actionButtons);
        messageDiv.appendChild(messageStats); // افزودن آمار پیام
        
        chatMessages.appendChild(messageDiv);
        // حذف اسکرول خودکار به پایین صفحه
        // chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageId;
    }
    
    // تابع پردازش بلوک‌های کد
    function processCodeBlocks(content) {
        // الگوی تشخیص بلوک‌های کد با سه بک‌تیک (```language\ncode```)
        const codeBlockPattern = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g;
        
        return content.replace(codeBlockPattern, (match, language, code) => {
            language = language.trim() || 'text';
            
            return `
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-block-language">${language}</span>
                        <button class="code-block-copy" onclick="copyCodeToClipboard(this)">
                            <i class="fas fa-copy"></i> کپی کد
                        </button>
                    </div>
                    <pre class="code-block-content">${escapeHtml(code)}</pre>
                </div>
            `;
        });
    }
    
    // تابع تبدیل کاراکترهای خاص به نمادهای HTML
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // تابع کپی کردن کد به کلیپ‌بورد
    window.copyCodeToClipboard = function(button) {
        const codeBlock = button.closest('.code-block');
        const codeContent = codeBlock.querySelector('.code-block-content').textContent;
        
        navigator.clipboard.writeText(codeContent).then(() => {
            updateConnectionStatus('کد با موفقیت کپی شد', true);
            // setTimeout حذف شد چون در خود تابع updateConnectionStatus اضافه شده
            
            // تغییر متن دکمه برای نشان دادن وضعیت کپی
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> کپی شد';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('خطا در کپی کردن متن:', err);
            updateConnectionStatus('خطا در کپی کردن کد', false, true);
        });
    };
    
    // Function to update stream message
    function updateStreamMessage(id, content, isError = false) {
        const messageElement = document.getElementById(id);
        const contentElement = messageElement?.querySelector('.message-content');
        const statsElement = messageElement?.querySelector('.message-stats');
        
        if (messageElement && contentElement) {
            // پردازش و تشخیص بلوک‌های کد
            let processedContent = processCodeBlocks(content);
            contentElement.innerHTML = processedContent;
            
            if (isError && !messageElement.classList.contains('error-message')) {
                messageElement.classList.add('error-message');
            }
            
            // به‌روزرسانی آمار پیام
            if (statsElement) {
                // محاسبه تعداد کلمات و توکن‌ها
                const wordCount = countWords(content);
                const tokenCount = estimateTokens(content);
                
                // نمایش تاریخ و زمان فعلی
                const now = new Date();
                const timeString = new Intl.DateTimeFormat('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(now);
                
                statsElement.innerHTML = `<span>${wordCount} کلمه</span> | <span>${tokenCount} توکن</span> | <span>${timeString}</span>`;
            }
            
            // حذف اسکرول خودکار به پایین صفحه
            // chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
    
    // تابع ویرایش پیام
    function editMessage(messageId, currentContent, isUser) {
        // فقط امکان ویرایش پیام‌های کاربر
        if (!isUser) {
            alert('فقط پیام‌های خودتان را می‌توانید ویرایش کنید.');
            return;
        }
        
        const newContent = prompt('پیام را ویرایش کنید:', currentContent);
        if (!newContent || newContent.trim() === '') return;
        
        // به‌روزرسانی در رابط کاربری
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (contentElement) {
                contentElement.textContent = newContent;
            }
        }
        
        // به‌روزرسانی در تاریخچه چت
        for (let i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].role === 'user' && chatHistory[i].content === currentContent) {
                chatHistory[i].content = newContent;
                saveChatHistory();
                break;
            }
        }
    }
    
    // تابع حذف پیام
    function deleteMessage(messageId, isUser) {
        if (!confirm('آیا از حذف این پیام اطمینان دارید؟')) return;
        
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;
        
        // پیدا کردن محتوای پیام
        const contentElement = messageElement.querySelector('.message-content');
        if (!contentElement) return;
        const messageContent = contentElement.textContent;
        
        // حذف از رابط کاربری
        messageElement.remove();
        
        // حذف از تاریخچه چت
        const role = isUser ? 'user' : 'assistant';
        let index = -1;
        
        // پیدا کردن اندیس پیام در تاریخچه
        for (let i = 0; i < chatHistory.length; i++) {
            if (chatHistory[i].role === role && chatHistory[i].content === messageContent) {
                index = i;
                break;
            }
        }
        
        if (index !== -1) {
            // اگر پیام کاربر حذف شود، پیام پاسخ بعدی آن هم باید حذف شود
            if (isUser && index + 1 < chatHistory.length && chatHistory[index + 1].role === 'assistant') {
                // پیدا کردن المنت پیام پاسخ و حذف آن
                const nextElements = document.querySelectorAll('.bot-message');
                let foundCurrent = false;
                for (const elem of nextElements) {
                    const content = elem.querySelector('.message-content');
                    if (content && content.textContent === chatHistory[index + 1].content) {
                        if (foundCurrent) {
                            elem.remove();
                            break;
                        }
                    }
                }
                // حذف پیام پاسخ از تاریخچه نیز
                chatHistory.splice(index, 2);
            } else {
                chatHistory.splice(index, 1);
            }
            
            // ذخیره تاریخچه به‌روزرسانی شده
            saveChatHistory();
        }
    }
    
    // Add typing indicator
    function addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator-container';
        typingDiv.id = 'typingIndicator';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        const avatarIcon = document.createElement('i');
        avatarIcon.className = 'fas fa-robot';
        avatar.appendChild(avatarIcon);
        
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message-content typing-indicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingIndicator.appendChild(dot);
        }
        
        typingDiv.appendChild(avatar);
        typingDiv.appendChild(typingIndicator);
        
        chatMessages.appendChild(typingDiv);
        // حذف اسکرول خودکار به پایین صفحه
        // chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // تابع محاسبه زمان سپری شده
    function formatElapsedTime(startTime, endTime) {
        const elapsed = Math.floor((endTime - startTime) / 1000); // به ثانیه
        
        if (elapsed < 60) {
            return `${elapsed} ثانیه`;
        } else if (elapsed < 3600) {
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            return `${minutes} دقیقه و ${seconds} ثانیه`;
        } else {
            const hours = Math.floor(elapsed / 3600);
            const minutes = Math.floor((elapsed % 3600) / 60);
            return `${hours} ساعت و ${minutes} دقیقه`;
        }
    }

    // Send message to LM Studio
    async function sendMessage(message) {
        try {
            // نمایش وضعیت اتصال
            updateConnectionStatus('در حال ارسال پیام به LM Studio...', false, false, false);
            
            // Add typing indicator
            addTypingIndicator();
            
            // Add user message to chat history
            chatHistory.push({ role: 'user', content: message });
            saveChatHistory();
            
            // تنظیم پیام های درست برای LM Studio - با رعایت دقیق نظم متناوب
            console.log('تنظیم پیام‌ها برای API با رعایت ترتیب متناوب...');
            
            // در LM Studio باید دقیقاً الگوی متناوب user/assistant رعایت شود
            let apiMessages = [];
            
            // گام ۱: ابتدا تمام تاریخچه را به ترتیب تاریخی مرتب کنیم
            const historyMessagesOnly = [...chatHistory];
            historyMessagesOnly.pop(); // حذف پیام کاربر فعلی
            
            // گام ۲: ایجاد لیست جدید با رعایت دقیق تناوب
            let lastRole = null;
            let cleanMessages = [];
            
            // حذف پیام‌های تکراری و اطمینان از تناوب درست
            for (const msg of historyMessagesOnly) {
                if (lastRole !== msg.role) {
                    cleanMessages.push(msg);
                    lastRole = msg.role;
                } else {
                    console.log(`حذف پیام تکراری با نقش ${msg.role}`);
                }
            }
            
            // گام ۳: اطمینان از شروع با user و پایان با assistant
            // اگر اولین پیام از user نیست، آن را حذف کنیم
            if (cleanMessages.length > 0 && cleanMessages[0].role !== 'user') {
                console.log('حذف پیام اول که با user شروع نمی‌شود');
                cleanMessages.shift();
            }
            
            // اگر آخرین پیام از assistant نیست، آن را حذف کنیم
            if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role !== 'assistant') {
                console.log('حذف پیام آخر که با assistant تمام نمی‌شود');
                cleanMessages.pop();
            }
            
            // گام ۴: همه پیام‌ها را برای API استفاده می‌کنیم - حذف محدودیت تعداد پیام‌ها
            apiMessages = [...cleanMessages];
            
            // گام ۵: بررسی نهایی اینکه آیا دقیقاً با الگوی user/assistant متناوب هستند
            for (let i = 0; i < apiMessages.length; i++) {
                const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
                if (apiMessages[i].role !== expectedRole) {
                    console.log(`خطا در تناوب: انتظار ${expectedRole} داشتیم ولی ${apiMessages[i].role} دریافت کردیم در موقعیت ${i}`);
                    // فقط افزودن پیام‌ها تا این نقطه
                    apiMessages = apiMessages.slice(0, i);
                    break;
                }
            }
            
            // گام ۶: افزودن پیام جدید کاربر
            // پیام سیستم را در پیام کاربر ادغام می‌کنیم
            apiMessages.push({
                role: 'user',
                content: `${settings.systemPrompt}\n\n${message}`
            });
            
            console.log('پیام‌های نهایی برای ارسال به API:', apiMessages);
            
            // نمایش وضعیت جدید
            updateConnectionStatus('در حال دریافت پاسخ از LM Studio...', false, false, true);
            
            // ساخت Payload برای API
            const payload = {
                model: "default",
                messages: apiMessages,
                temperature: settings.temperature,
                max_tokens: settings.maxTokens,
                stream: true
            };
            
            // ارسال درخواست
            const apiResponse = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // بررسی پاسخ
            if (!apiResponse.ok) {
                throw new Error(`خطای HTTP ${apiResponse.status}`);
            }
            
            // حذف نشانگر تایپ
            removeTypingIndicator();
            
            // ساخت پیام خالی برای استریم
            const streamMessageId = 'stream-message-' + Date.now();
            addEmptyMessage(streamMessageId);
            
            // پردازش استریم و دریافت پاسخ کامل
            const reader = apiResponse.body.getReader();
            const fullResponse = await processStreamData(reader, streamMessageId);
            
            // بستن reader
            reader.releaseLock();
            
            // به‌روزرسانی وضعیت اتصال
            updateConnectionStatus('پاسخ با موفقیت دریافت شد', true, false, false);
            
            console.log('پاسخ کامل از API دریافت شد');
            return fullResponse;
            
        } catch (error) {
            console.error('خطا در ارتباط با LM Studio:', error);
            
            // حذف نشانگر تایپ
            removeTypingIndicator();
            
            // نمایش خطا به کاربر
            const errorMessage = `خطا در ارتباط با LM Studio: ${error.message}`;
            addMessage(errorMessage, false, true);
            
            // به‌روزرسانی وضعیت اتصال
            updateConnectionStatus(`خطا در اتصال: ${error.message}`, false, true, false);
            
            return null;
        }
    }
    
    // Handle send message
    function handleSendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // پنهان کردن پیام خوش‌آمدگویی
        hideWelcomeMessage();
        
        // گرفتن فوکس از کادر متن
        userInput.blur();
        
        // افزودن پیام کاربر به چت
        addMessage(message, true);
        
        // تنظیم مجدد کادر متن
        userInput.value = '';
        userInput.style.height = 'auto';
        
        // ارسال پیام به LM Studio
        sendMessage(message);
    }
    
    // Event listeners
    userInput.addEventListener('input', autoResizeTextarea);
    
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    sendBtn.addEventListener('click', handleSendMessage);
    
    // دکمه نمایش پرامپت‌های قبلی
    document.getElementById('showPreviousPromptsBtn').addEventListener('click', showPreviousPrompts);
    
    settingsBtn.addEventListener('click', () => {
        // اگر پنل تنظیمات باز است، آن را ببندید، در غیر این صورت باز کنید
        if (settingsPanel.classList.contains('show')) {
            settingsPanel.classList.remove('show');
        } else {
            loadSettings();
            showPanel(settingsPanel);
        }
    });
    
    helpBtn.addEventListener('click', () => {
        // اگر پنل راهنما باز است، آن را ببندید، در غیر این صورت باز کنید
        if (helpPanel.classList.contains('show')) {
            helpPanel.classList.remove('show');
        } else {
            showPanel(helpPanel);
        }
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        hideAllPanels();
    });
    
    closeHelpBtn.addEventListener('click', () => {
        hideAllPanels();
    });
    
    saveSettingsBtn.addEventListener('click', saveSettings);
    
    testConnectionBtn.addEventListener('click', () => {
        checkLMStudioConnection(true);
    });
    
    // دکمه تست اتصال در پنل راهنما
    document.getElementById('testConnectionFromHelp').addEventListener('click', () => {
        checkLMStudioConnection(true);
        hideAllPanels();
    });
    
    clearHistoryBtn.addEventListener('click', clearChatHistory);
    
    temperatureSlider.addEventListener('input', () => {
        temperatureValue.textContent = temperatureSlider.value;
    });
    
    // Event listeners for history functionality
    newChatBtn.addEventListener('click', createNewChat);
    
    historyBtn.addEventListener('click', () => {
        // اگر پنل تاریخچه باز است، آن را ببندید، در غیر این صورت باز کنید
        if (historyPanel.classList.contains('show')) {
            historyPanel.classList.remove('show');
        } else {
            refreshHistoryList();
            showPanel(historyPanel);
        }
    });
    
    // بستن پنل تاریخچه
    closeHistoryBtn.addEventListener('click', () => {
        hideAllPanels();
    });
    
    // Clear active chat history (not all chats)
    function clearChatHistory() {
        if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه چت فعلی را پاک کنید؟')) {
            // شروع با یک چت خالی بدون پیام‌های پیش‌فرض
            chatHistory = [];
            saveChatHistory();
            loadChatHistoryToUI();
            
            // تنظیم وضعیت اتصال
            updateConnectionStatus('تاریخچه چت پاک شد', true, false, false);
        }
    }
    
    // Check LM Studio connection
    async function checkLMStudioConnection(showResult = false) {
        updateConnectionStatus('در حال بررسی اتصال به LM Studio...', false, false, false);
        
        try {
            // اول سعی می‌کنیم endpoint models را بررسی کنیم
            const testUrl = settings.apiUrl.replace(/\/chat\/completions$/, '/models');
            console.log('Testing LM Studio connection at:', testUrl);
            
            let response;
            try {
                response = await fetch(testUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                    // حذف تایم‌اوت برای جلوگیری از مشکلات
                });
            } catch (e) {
                // اگر endpoint models کار نکرد، از یک درخواست ساده استفاده می‌کنیم
                console.log('Models endpoint not available, trying a basic request');
                
                const basicPayload = {
                    model: "default",
                    messages: [
                        {
                            role: 'user',
                            content: 'سلام'
                        },
                        {
                            role: 'assistant',
                            content: 'سلام! چطور می‌توانم کمک کنم؟'
                        },
                        {
                            role: 'user',
                            content: 'تست اتصال'
                        }
                    ],
                    max_tokens: 5,
                    temperature: 0.1,
                    stream: false
                };
                
                response = await fetch(settings.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(basicPayload)
                    // حذف تایم‌اوت برای جلوگیری از مشکلات
                });
            }
            
            if (response.ok) {
                console.log('LM Studio API is accessible');
                updateConnectionStatus('اتصال با LM Studio برقرار شد', true, false, false);
                
                try {
                    const responseData = await response.json();
                    console.log('API response:', responseData);
                } catch (e) {
                    console.log('Could not parse response as JSON but connection is working');
                }
                
                if (showResult) {
                    addMessage('اتصال به LM Studio با موفقیت برقرار شد. سرور در دسترس است.', false);
                }
            } else {
                updateConnectionStatus(`خطا در اتصال به LM Studio (کد ${response.status})`, false, true, false);
                throw new Error(`Error status: ${response.status}`);
            }
        } catch (error) {
            console.warn('LM Studio API connection error:', error);
            updateConnectionStatus('عدم اتصال به LM Studio', false, true, false);
            
            if (showResult) {
                const errorDetail = `خطای اتصال: ${error.message}`;
                addMessage(`اتصال به LM Studio برقرار نشد. لطفاً مطمئن شوید LM Studio در حال اجراست و API آن فعال است.\n\n${errorDetail}`, false, true);
            } else {
                addMessage('توجه: اتصال به LM Studio برقرار نشد. لطفاً مطمئن شوید LM Studio در حال اجراست و API آن فعال است. برای اطلاعات بیشتر به کنسول مرورگر مراجعه کنید.', false, true);
            }
        }
    }
    
    // Load saved chat history to UI
    loadChatHistoryToUI();
    
    // Initial setup
    loadSettings();
    autoResizeTextarea();
    
    // کمی تأخیر در بررسی اتصال برای اجازه دادن به صفحه برای بارگذاری کامل
    setTimeout(checkLMStudioConnection, 1000);

    // Add empty message for streaming
    function addEmptyMessage(id) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.id = id;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        
        const avatarIcon = document.createElement('i');
        avatarIcon.className = 'fas fa-robot';
        avatar.appendChild(avatarIcon);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.id = id + '-content';
        messageContent.textContent = '';
        
        // اضافه کردن دکمه‌های عملیات
        const actionButtons = document.createElement('div');
        actionButtons.className = 'message-actions';
        
        // دکمه تکرار پاسخ
        const regenerateButton = document.createElement('button');
        regenerateButton.className = 'action-btn regenerate-btn';
        regenerateButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
        regenerateButton.title = 'تکرار پاسخ';
        regenerateButton.onclick = () => regenerateAnswer(id);
        
        // شمارشگر تکرار
        const countBadge = document.createElement('span');
        countBadge.className = 'regenerate-count';
        countBadge.textContent = '0';
        countBadge.style.display = 'none';
        
        // دکمه نمایش پاسخ‌های قبلی
        const historyButton = document.createElement('button');
        historyButton.className = 'action-btn previous-answers-btn';
        historyButton.innerHTML = '<i class="fas fa-history"></i>';
        historyButton.title = 'نمایش پاسخ‌های قبلی';
        historyButton.onclick = () => showPreviousAnswers(id);
        historyButton.style.display = 'none';
        
        // ذخیره اطلاعات مورد نیاز برای تکرار پاسخ
        messageDiv.dataset.regenerateCount = '0';
        
        // دکمه حذف
        const deleteButton = document.createElement('button');
        deleteButton.className = 'action-btn delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
        deleteButton.title = 'حذف پیام';
        deleteButton.onclick = () => deleteMessage(id, false);
        
        // افزودن دکمه‌ها به باکس عملیات
        actionButtons.appendChild(regenerateButton);
        actionButtons.appendChild(countBadge);
        actionButtons.appendChild(historyButton);
        actionButtons.appendChild(deleteButton);
        
        // افزودن زیرنویس آمار پیام خالی
        const messageStats = document.createElement('div');
        messageStats.className = 'message-stats';
        messageStats.innerHTML = `<span>0 کلمه</span> | <span>0 توکن</span> | <span>در حال نوشتن...</span>`;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(actionButtons);
        messageDiv.appendChild(messageStats); // افزودن آمار پیام
        
        chatMessages.appendChild(messageDiv);
        // حذف اسکرول خودکار به پایین صفحه
        // chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return id;
    }
    
    // تابع نمایش پنل با پس‌زمینه overlay
    function showPanel(panel) {
        // ابتدا همه پنل‌ها را ببندیم
        settingsPanel.classList.remove('show');
        helpPanel.classList.remove('show');
        historyPanel.classList.remove('show');
        
        // سپس پنل مورد نظر و پس‌زمینه را نمایش دهیم
        panel.classList.add('show');
        panelOverlay.classList.add('show');
    }
    
    // تابع مخفی کردن همه پنل‌ها و پس‌زمینه
    function hideAllPanels() {
        settingsPanel.classList.remove('show');
        helpPanel.classList.remove('show');
        historyPanel.classList.remove('show');
        panelOverlay.classList.remove('show');
    }
    
    // بستن پنل‌ها با کلیک روی overlay
    panelOverlay.addEventListener('click', hideAllPanels);

    // تابع دریافت آخرین پیام کاربر از تاریخچه
    function getLastUserQuestion() {
        for (let i = chatHistory.length - 1; i >= 0; i--) {
            if (chatHistory[i].role === 'user') {
                return chatHistory[i].content;
            }
        }
        return '';
    }
    
    // تابع تکرار پاسخ
    async function regenerateAnswer(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;
        
        // افزایش شمارنده تکرار
        let regenerateCount = parseInt(messageElement.dataset.regenerateCount || '0') + 1;
        messageElement.dataset.regenerateCount = regenerateCount.toString();
        
        // به‌روزرسانی شمارشگر نمایشی
        const countBadge = messageElement.querySelector('.regenerate-count');
        if (countBadge) {
            countBadge.textContent = regenerateCount.toString();
            countBadge.style.display = 'inline-block';
        }
        
        // فعال‌سازی دکمه نمایش پاسخ‌های قبلی
        const historyButton = messageElement.querySelector('.previous-answers-btn');
        if (historyButton) {
            historyButton.style.display = 'inline-flex';
        }
        
        // دریافت سوال کاربر
        const userQuestion = getLastUserQuestion();
        if (!userQuestion) {
            console.error('سوال کاربر یافت نشد');
            return;
        }
        
        // نمایش وضعیت اتصال
        updateConnectionStatus('در حال تکرار پاسخ...', false, false, false);
        
        // ذخیره پاسخ فعلی
        let answers = [];
        try {
            answers = JSON.parse(messageElement.dataset.answers || '[]');
        } catch (e) {
            console.error('خطا در خواندن پاسخ‌های قبلی:', e);
            answers = [{
                content: messageElement.querySelector('.message-content').textContent,
                timestamp: new Date().toISOString()
            }];
        }
        
        // برداشتن پاسخ قبلی از تاریخچه
        if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
            chatHistory.pop();
        }
        
        // اضافه کردن نشانگر تایپ
        addTypingIndicator();
        
        // ارسال دوباره درخواست به API
        try {
            // تنظیم پیام های درست برای LM Studio - با رعایت دقیق نظم متناوب
            console.log('تنظیم پیام‌ها برای API با رعایت ترتیب متناوب...');
            
            // در LM Studio باید دقیقاً الگوی متناوب user/assistant رعایت شود
            let apiMessages = [];
            
            // ایجاد کپی از تاریخچه چت
            const tempHistory = [...chatHistory];
            
            // گام ۱: ابتدا تمام تاریخچه را به ترتیب تاریخی مرتب کنیم
            
            // گام ۲: ایجاد لیست جدید با رعایت دقیق تناوب
            let lastRole = null;
            let cleanMessages = [];
            
            // حذف پیام‌های تکراری و اطمینان از تناوب درست
            for (const msg of tempHistory) {
                if (lastRole !== msg.role) {
                    cleanMessages.push(msg);
                    lastRole = msg.role;
                } else {
                    console.log(`حذف پیام تکراری با نقش ${msg.role}`);
                }
            }
            
            // گام ۳: اطمینان از شروع با user و پایان با assistant
            // اگر اولین پیام از user نیست، آن را حذف کنیم
            if (cleanMessages.length > 0 && cleanMessages[0].role !== 'user') {
                console.log('حذف پیام اول که با user شروع نمی‌شود');
                cleanMessages.shift();
            }
            
            // اگر آخرین پیام از assistant نیست، آن را حذف کنیم
            if (cleanMessages.length > 0 && cleanMessages[cleanMessages.length - 1].role !== 'user') {
                console.log('حذف پیام آخر که با user تمام نمی‌شود');
                cleanMessages.pop();
            }
            
            // گام ۴: همه پیام‌ها را برای API استفاده می‌کنیم - حذف محدودیت تعداد پیام‌ها
            apiMessages = [...cleanMessages];
            
            // گام ۵: بررسی نهایی اینکه آیا دقیقاً با الگوی user/assistant متناوب هستند
            for (let i = 0; i < apiMessages.length; i++) {
                const expectedRole = i % 2 === 0 ? 'user' : 'assistant';
                if (apiMessages[i].role !== expectedRole) {
                    console.log(`خطا در تناوب: انتظار ${expectedRole} داشتیم ولی ${apiMessages[i].role} دریافت کردیم در موقعیت ${i}`);
                    // فقط افزودن پیام‌ها تا این نقطه
                    apiMessages = apiMessages.slice(0, i);
                    break;
                }
            }
            
            // گام ۶: افزودن پیام سیستم به پیام کاربر
            apiMessages.push({
                role: 'user',
                content: `${settings.systemPrompt}\n\n${userQuestion}`
            });
            
            console.log('پیام‌های نهایی برای ارسال به API:', apiMessages);
            
            // نمایش وضعیت برای ارسال درخواست
            updateConnectionStatus('در حال دریافت پاسخ جدید...', false, false, true);
            
            // ساخت Payload برای API
            const payload = {
                model: "default",
                messages: apiMessages,
                temperature: settings.temperature,
                max_tokens: settings.maxTokens,
                stream: true
            };
            
            // ارسال درخواست
            const apiResponse = await fetch(settings.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            // بررسی پاسخ
            if (!apiResponse.ok) {
                throw new Error(`خطای HTTP ${apiResponse.status}`);
            }
            
            // حذف نشانگر تایپ
            removeTypingIndicator();
            
            // ساخت پیام خالی برای استریم
            const streamMessageId = 'stream-message-' + Date.now();
            addEmptyMessage(streamMessageId);
            
            // پردازش استریم و دریافت پاسخ کامل
            const reader = apiResponse.body.getReader();
            const fullResponse = await processStreamData(reader, streamMessageId);
            
            // بستن reader
            reader.releaseLock();
            
            // به‌روزرسانی وضعیت اتصال
            updateConnectionStatus('پاسخ جدید با موفقیت دریافت شد', true, false);
            
            console.log('پاسخ کامل از API دریافت شد');
            return fullResponse;
            
        } catch (error) {
            console.error('خطا در زمان تکرار پاسخ:', error);
            removeTypingIndicator();
            addMessage('خطا در تکرار پاسخ: ' + error.message, false, true);
            
            // نمایش خطا در نوار وضعیت
            updateConnectionStatus(`خطا در تکرار پاسخ: ${error.message}`, false, true);
        }
    }
    
    // تابع نمایش پاسخ‌های قبلی
    function showPreviousAnswers(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;
        
        // دریافت تاریخچه پاسخ‌ها
        let answers = [];
        try {
            answers = JSON.parse(messageElement.dataset.answers || '[]');
        } catch (e) {
            console.error('خطا در خواندن پاسخ‌های قبلی:', e);
            return;
        }
        
        if (answers.length <= 1) {
            alert('هنوز پاسخ قبلی وجود ندارد');
            return;
        }
        
        // ایجاد پنل نمایش پاسخ‌های قبلی
        const answersPanel = document.createElement('div');
        answersPanel.className = 'settings-panel previous-answers-panel';
        answersPanel.id = 'previousAnswersPanel';
        
        // هدر پنل
        const panelHeader = document.createElement('div');
        panelHeader.className = 'settings-header';
        
        const headerTitle = document.createElement('h3');
        headerTitle.textContent = 'پاسخ‌های قبلی';
        
        const closeButton = document.createElement('div');
        closeButton.className = 'close-button';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.onclick = () => {
            answersPanel.remove();
            document.getElementById('panelOverlay')?.classList.remove('show');
        };
        
        panelHeader.appendChild(headerTitle);
        panelHeader.appendChild(closeButton);
        
        // محتوای پنل
        const panelContent = document.createElement('div');
        panelContent.className = 'settings-content';
        
        // لیست پاسخ‌ها
        answers.forEach((answer, index) => {
            const answerItem = document.createElement('div');
            answerItem.className = 'previous-answer-item';
            
            const answerHeader = document.createElement('div');
            answerHeader.className = 'previous-answer-header';
            
            const answerNumber = document.createElement('div');
            answerNumber.className = 'previous-answer-number';
            answerNumber.textContent = `پاسخ #${index + 1}`;
            
            const answerTime = document.createElement('div');
            answerTime.className = 'previous-answer-time';
            // تبدیل تاریخ به فرمت فارسی
            const date = new Date(answer.timestamp);
            const formattedDate = new Intl.DateTimeFormat('fa-IR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }).format(date);
            answerTime.textContent = formattedDate;
            
            answerHeader.appendChild(answerNumber);
            answerHeader.appendChild(answerTime);
            
            const answerContent = document.createElement('div');
            answerContent.className = 'previous-answer-content';
            answerContent.textContent = answer.content;
            
            const useButton = document.createElement('button');
            useButton.className = 'btn-save previous-answer-use';
            useButton.textContent = 'استفاده از این پاسخ';
            useButton.onclick = () => {
                // به‌روزرسانی محتوای پیام در UI
                const contentElement = messageElement.querySelector('.message-content');
                if (contentElement) {
                    contentElement.textContent = answer.content;
                }
                
                // به‌روزرسانی آخرین پیام در تاریخچه چت
                if (chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant') {
                    chatHistory[chatHistory.length - 1].content = answer.content;
                    saveChatHistory();
                }
                
                // بستن پنل
                answersPanel.remove();
                document.getElementById('panelOverlay')?.classList.remove('show');
            };
            
            answerItem.appendChild(answerHeader);
            answerItem.appendChild(answerContent);
            answerItem.appendChild(useButton);
            
            panelContent.appendChild(answerItem);
        });
        
        answersPanel.appendChild(panelHeader);
        answersPanel.appendChild(panelContent);
        
        // ایجاد overlay
        const overlay = document.createElement('div');
        overlay.className = 'panel-overlay show';
        overlay.id = 'panelOverlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                answersPanel.remove();
                overlay.classList.remove('show');
            }
        };
        
        // افزودن به DOM
        document.body.appendChild(overlay);
        document.body.appendChild(answersPanel);
    }

    async function processStreamData(reader, streamMessageId) {
        try {
            let fullResponse = '';
            let token = '';
            let responseStartTime = Date.now(); // زمان شروع دریافت پاسخ
            let isFirstChunk = true;
            
            // به‌روزرسانی وضعیت به "در حال دریافت پاسخ" - با پارامتر isStreaming=true
            updateConnectionStatus('در حال دریافت پاسخ...', false, false, true);
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                if (isFirstChunk) {
                    isFirstChunk = false;
                    responseStartTime = Date.now();
                    // اولین قطعه داده دریافت شد - با پارامتر isStreaming=true
                    updateConnectionStatus('در حال دریافت جواب...', false, false, true);
                }
                
                const chunk = new TextDecoder().decode(value);
                
                // پردازش استریم
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const jsonData = line.substring(6);
                        if (jsonData === '[DONE]') {
                            console.log('استریم کامل شد');
                            continue;
                        }
                        
                        try {
                            const data = JSON.parse(jsonData);
                            if (data.choices && data.choices.length > 0) {
                                // دریافت یک توکن جدید
                                const delta = data.choices[0].delta;
                                if (delta && delta.content) {
                                    token += delta.content;
                                    fullResponse += delta.content;
                                }
                            }
                        } catch (e) {
                            console.error('خطا در تجزیه JSON:', e);
                        }
                    }
                }
                
                // بروزرسانی پیام در UI با محتوای فعلی
                updateStreamMessage(streamMessageId, fullResponse);
            }
            
            // محاسبه مدت زمان دریافت پاسخ
            const responseEndTime = Date.now();
            const elapsedTime = formatElapsedTime(responseStartTime, responseEndTime);
            
            // بروزرسانی آمار پیام با زمان نوشته شدن
            const messageElement = document.getElementById(streamMessageId);
            const statsElement = messageElement?.querySelector('.message-stats');
            
            if (statsElement) {
                // محاسبه تعداد کلمات و توکن‌ها
                const wordCount = countWords(fullResponse);
                const tokenCount = estimateTokens(fullResponse);
                
                // نمایش تاریخ و زمان فعلی
                const now = new Date();
                const timeString = new Intl.DateTimeFormat('fa-IR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }).format(now);
                
                statsElement.innerHTML = `<span>${wordCount} کلمه</span> | <span>${tokenCount} توکن</span> | <span>${timeString}</span> | <span>زمان نوشتن: ${elapsedTime}</span>`;
            }
            
            // به‌روزرسانی پیام در تاریخچه چت
            const newAssistantMessage = {
                role: 'assistant',
                content: fullResponse
            };
            
            chatHistory.push(newAssistantMessage);
            saveChatHistory();
            saveCurrentChat();
            
            // اعلام پایان دریافت - بدون isStreaming چون پاسخ کامل شده
            updateConnectionStatus('پاسخ کامل دریافت شد', true, false, false);
            
            console.log('پاسخ کامل دریافت شد');
            return fullResponse;
        } catch (error) {
            console.error('خطا در پردازش استریم:', error);
            
            // نمایش خطا در رابط کاربری
            updateStreamMessage(streamMessageId, 'خطا در دریافت پاسخ از API: ' + error.message, true);
            
            // به‌روزرسانی پیام در تاریخچه چت
            const errorMessage = {
                role: 'assistant',
                content: 'خطا در دریافت پاسخ از API: ' + error.message
            };
            
            chatHistory.push(errorMessage);
            saveChatHistory();
            saveCurrentChat();
            
            // اعلام خطا
            updateConnectionStatus(`خطا در دریافت پاسخ: ${error.message}`, false, true, false);
            
            throw error;
        }
    }
});