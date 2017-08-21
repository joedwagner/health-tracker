// Individual tracked item
var TrackedItemView = Backbone.View.extend({

    tagName: 'tr',
    className: 'tracked-item-row',
    template: _.template($('#tracked-item-template').html()),

    initialize: function (options) {
        this.eventList = options.eventList;
    },

    render: function () {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    events: {
        'click .remove': 'untrackItem'
    },

    untrackItem: function (event) {
        this.eventList.trigger('removeItem', this);
    }

});