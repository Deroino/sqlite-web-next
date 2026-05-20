App = window.App || {};

(function(exports, $) {
    AIChat = function() {};

    AIChat.prototype.initialize = function() {
        this.modal = $('#aiChatModal');
        this.input = this.modal.find('#ai-chat-input');
        this.sendBtn = this.modal.find('#ai-chat-send');
        this.resultArea = this.modal.find('#ai-chat-result');
        this.useQueryBtn = this.modal.find('#ai-use-query');
        this.loadingIndicator = this.modal.find('#ai-chat-loading');
        this.tables = [];
        this.mentionedTables = [];
        this.generatedSQL = '';

        this.bindHandlers();
        this.fetchTables();
    };

    AIChat.prototype.fetchTables = function() {
        var self = this;
        $.getJSON('/ai/tables/', function(data) {
            self.tables = data;
        });
    };

    AIChat.prototype.bindHandlers = function() {
        var self = this;

        // Send on Enter (Shift+Enter for newline)
        this.input.on('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                self.sendPrompt();
            }
        });

        this.sendBtn.on('click', function(e) {
            e.preventDefault();
            self.sendPrompt();
        });

        this.useQueryBtn.on('click', function(e) {
            e.preventDefault();
            self.useQuery();
        });

        // Reset state when modal closes
        this.modal.on('hidden.bs.modal', function() {
            self.resultArea.empty().hide();
            self.useQueryBtn.hide();
            self.input.val('');
            self.generatedSQL = '';
            self.mentionedTables = [];
        });

        // Refresh tables when modal opens
        this.modal.on('show.bs.modal', function() {
            self.fetchTables();
        });
    };

    AIChat.prototype.detectMentions = function(text) {
        // Detect @table_name patterns and match against known tables
        var mentionRegex = /@(\w+)/g;
        var match;
        var mentioned = [];
        while ((match = mentionRegex.exec(text)) !== null) {
            var name = match[1];
            for (var i = 0; i < this.tables.length; i++) {
                if (this.tables[i].toLowerCase() === name.toLowerCase()) {
                    if (mentioned.indexOf(this.tables[i]) === -1) {
                        mentioned.push(this.tables[i]);
                    }
                    break;
                }
            }
        }
        return mentioned;
    };

    AIChat.prototype.sendPrompt = function() {
        var self = this;
        var message = this.input.val().trim();
        if (!message) return;

        this.mentionedTables = this.detectMentions(message);

        this.sendBtn.prop('disabled', true);
        this.loadingIndicator.show();
        this.resultArea.empty().hide();
        this.useQueryBtn.hide();

        $.ajax({
            url: '/ai/chat/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                message: message,
                mentioned_tables: this.mentionedTables
            }),
            success: function(data) {
                self.sendBtn.prop('disabled', false);
                self.loadingIndicator.hide();
                if (data.sql) {
                    self.generatedSQL = data.sql;
                    self.resultArea.html(
                        '<pre class="bg-light p-3 rounded mb-0">' +
                        $('<span>').text(data.sql).html() +
                        '</pre>'
                    ).show();
                    self.useQueryBtn.show();
                } else if (data.error) {
                    self.resultArea.html(
                        '<div class="alert alert-warning mb-0">' + $('<span>').text(data.error).html() + '</div>'
                    ).show();
                }
            },
            error: function(xhr) {
                self.sendBtn.prop('disabled', false);
                self.loadingIndicator.hide();
                var errorMsg = 'Request failed.';
                try {
                    var resp = JSON.parse(xhr.responseText);
                    errorMsg = resp.error || errorMsg;
                } catch(e) {}
                self.resultArea.html(
                    '<div class="alert alert-danger mb-0">' + $('<span>').text(errorMsg).html() + '</div>'
                ).show();
            }
        });
    };

    AIChat.prototype.useQuery = function() {
        if (!this.generatedSQL) return;
        window.location.href = '/query/?sql=' + encodeURIComponent(this.generatedSQL);
    };

    exports.AIChat = AIChat;
})(App, jQuery);
