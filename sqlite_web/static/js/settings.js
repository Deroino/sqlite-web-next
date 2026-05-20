App = window.App || {};

(function(exports, $) {
    Settings = function() {};

    Settings.prototype.initialize = function() {
        this.modal = $('#settingsModal');
        this.form = this.modal.find('#settings-form');
        this.saveBtn = this.modal.find('#settings-save-btn');
        this.inpTitle = this.form.find('#setting-title');
        this.inpSafeQuery = this.form.find('#setting-safe-query');
        this.inpAiUrl = this.form.find('#setting-ai-url');
        this.inpAiModel = this.form.find('#setting-ai-model');
        this.inpAiKey = this.form.find('#setting-ai-key');
        this.bindHandlers();
    };

    Settings.prototype.bindHandlers = function() {
        var self = this;

        /* Load settings when modal opens. */
        this.modal.on('show.bs.modal', function() {
            self.loadSettings();
        });

        /* Save settings on button click. */
        this.saveBtn.on('click', function(e) {
            e.preventDefault();
            self.saveSettings();
        });
    };

    Settings.prototype.loadSettings = function() {
        var self = this;
        $.getJSON('/settings/', function(data) {
            self.inpTitle.val(data.title || '');
            self.inpSafeQuery.prop('checked', data.safe_query !== false);
            self.inpAiUrl.val(data.ai_url || '');
            self.inpAiModel.val(data.ai_model || '');
            self.inpAiKey.val(data.ai_api_key || '');
        });
    };

    Settings.prototype.saveSettings = function() {
        var self = this;
        var formData = {
            title: this.inpTitle.val(),
            safe_query: this.inpSafeQuery.is(':checked') ? 'true' : 'false',
            ai_url: this.inpAiUrl.val(),
            ai_model: this.inpAiModel.val(),
            ai_api_key: this.inpAiKey.val()
        };
        $.post('/settings/', formData, function() {
            self.modal.modal('hide');
            /* Reload page to reflect title change. */
            window.location.reload();
        }).fail(function() {
            alert('Failed to save settings.');
        });
    };

    exports.Settings = Settings;
})(App, jQuery);
