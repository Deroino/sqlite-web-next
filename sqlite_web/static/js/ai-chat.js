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
        this.mentionsArea = this.modal.find('#ai-mentioned-tables');
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
            self.refreshMentions();
        });
    };

    AIChat.prototype.bindHandlers = function() {
        var self = this;

        this.input.on('input', function() {
            self.refreshMentions();
        });

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
            self.mentionsArea.empty().hide();
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

    AIChat.prototype.refreshMentions = function() {
        var mentioned = this.detectMentions(this.input.val());
        this.mentionedTables = mentioned;

        if (!mentioned.length) {
            this.mentionsArea.empty().hide();
            return;
        }

        var html = '<span class="text-muted mr-2">Detected tables:</span>';
        for (var i = 0; i < mentioned.length; i++) {
            html += '<span class="badge badge-info mr-1">@' + $('<span>').text(mentioned[i]).html() + '</span>';
        }
        this.mentionsArea.html(html).show();
    };

    AIChat.prototype.renderResponse = function(payload) {
        var content = payload.raw_response || payload.sql || payload.error || 'No response.';
        var isError = !!payload.error && !payload.sql;
        var sql = payload.sql || '';

        if (sql) {
            this.generatedSQL = sql;
            this.useQueryBtn.show();
        } else {
            this.generatedSQL = '';
            this.useQueryBtn.hide();
        }

        var klass = isError ? 'alert alert-warning mb-0' : 'alert alert-secondary mb-0';
        var label = payload.error ? '<div class="mb-2 font-weight-bold">AI response</div>' : '';
        var body = $('<div>').text(content).html();
        this.resultArea.html('<div class="' + klass + '">' + label + '<pre class="bg-light p-3 rounded mb-0">' + body + '</pre></div>').show();
    };

    AIChat.prototype.sendPrompt = function() {
        var self = this;
        var message = this.input.val().trim();
        if (!message) return;

        this.refreshMentions();

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
                self.renderResponse(data);
            },
            error: function(xhr) {
                self.sendBtn.prop('disabled', false);
                self.loadingIndicator.hide();
                var resp = {};
                try {
                    resp = JSON.parse(xhr.responseText);
                } catch(e) {}
                self.renderResponse({
                    error: resp.error || 'Request failed.',
                    raw_response: resp.raw_response || resp.error || 'Request failed.'
                });
            }
        });
    };

    AIChat.prototype.useQuery = function() {
        if (!this.generatedSQL) return;
        window.location.href = '/query/?sql=' + encodeURIComponent(this.generatedSQL);
    };

    exports.AIChat = AIChat;
})(App, jQuery);
