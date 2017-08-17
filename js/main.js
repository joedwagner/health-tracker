$(function() {

    // Init the app
    var eventList = _.extend({}, Backbone.Events);
    var trackedItemListView = new TrackedItemListView({eventList: eventList});
    var searchResultListView = new SearchResultsView({eventList: eventList});

    var searchBox = $('#search-box');

    $('#search-form').submit(function (event) {

        searchResultListView.makeSearchRequest(searchBox.val());

        event.preventDefault();
    });
});

// Backbone stuff

// Define model and collection for Nutritional Items
var NutritionItem = Backbone.Model.extend({

    defaults: {
        brandName: 'My Brand',
        itemName: 'Item 1',
        calories: 0,
    }

});

var NutritionItemCollection = Backbone.Collection.extend({

    model: NutritionItem

});

// View for individual search result
var SearchResultItemView = Backbone.View.extend({

    tagName: 'li',
    className: 'search-result-item',
    template: _.template($('#search-result-item-template').html()),

    initialize: function (options) {
        this.eventList = options.eventList;
    },

    render: function () {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    events: {
        'click .add': 'trackItem'
    },

    trackItem: function (event) {
        console.log(this);
        this.eventList.trigger('addItem', this);
    }

});

// larger container view for search results list
var SearchResultsView = Backbone.View.extend({

    tagName: 'section',
    id: 'search-results',
    template: _.template($('#search-results-template').html()),
    searchMade: false,

    render: function () {
        this.$el.html(this.template(this));
        return this;
    },

    initialize: function (options) {
        this.collection = new NutritionItemCollection();
        $('#search').append(this.render().el);

        // Listen to the shared pub/sub eventList
        this.eventList = options.eventList;
        _.bindAll(this, 'clearSearchResults');
        this.eventList.bind('clearSearchResults', this.clearSearchResults);

    },

    // Function that makes a call to Foursquare API to return user's search results
    makeSearchRequest: function(input) {

        var self = this;


        // Make sure a search query string was entered
        if (input) {

            //Construct the request url
            var baseUrl = 'https://api.nutritionix.com/v1_1/search/';
            var appId = '19232de1';
            var appKey = '853355e4f6066c34a3416803c7af0168';

            var requestUrl = baseUrl +
            input +
            '?appId=' + appId +
            '&appKey=' + appKey +
            '&results=0:10' +
            '&fields=item_name,brand_name,nf_calories';

            // Make the request
            $.getJSON(requestUrl, function (results) {

                // Clear the search results list
                // self.$el.empty();

                var item;
                var itemView;
                self.collection = new NutritionItemCollection();

                // reset the view
                self.searchMade = true;
                self.$el.remove();
                $('#search').append(self.render().el);

                // Create each the search result nutritional item views and display them to the user
                results.hits.forEach(function (result) {
                    var brand = result.fields.brand_name;
                    var itemName = result.fields.item_name;
                    var calories = result.fields.nf_calories;

                    item = new NutritionItem({
                        brandName: brand,
                        itemName: itemName,
                        calories: calories,
                    });

                    itemView = new SearchResultItemView({
                        model: item,
                        eventList: self.eventList
                    });

                    self.addItem(itemView);

                });

            }).fail(function () {
                console.log('everything is ruined!');
            });
        }
    },

    addItem: function (item) {

        this.collection.add(item.model);
        console.log(this.collection.length);

        if (this.collection.length === 1) {
            this.$el.remove();
            $('#search').append(this.render().el);
        }

        $('#search-results-list').append(item.render().el);
    },

    clearSearchResults: function (item) {
        this.$el.find('#search-results-list').empty();
    }

});

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

// Container for tracked items
var TrackedItemListView = Backbone.View.extend({

    tagName: 'section',
    id: 'tracked-items',
    template: _.template($('#tracked-item-list-template').html()),
    totalTemplate: _.template($('#total-calories-template').html()),

    render: function () {
        this.$el.html(this.template(this));

        return this;
    },

    initialize: function (options) {

        var self = this;

        this.collection = new NutritionItemCollection();

        $('#app').append(this.render().el);

        this.listenTo(this.collection, 'add', this.updateDB);
        this.listenTo(this.collection, 'remove', this.updateDB);

        // Listen to the shared pub/sub eventList
        this.eventList = options.eventList;
        _.bindAll(this, 'addItem', 'removeItem');
        this.eventList.bind('addItem', this.addItem);
        this.eventList.bind('removeItem', this.removeItem);

        var savedItems = localStorage.getItem('tracked-items');

        if (savedItems != null) {
            var items = JSON.parse(savedItems);
            items.forEach(function (savedItem) {
                var item = new NutritionItem(savedItem);
                self.addItem(new TrackedItemView({model: item}, {eventList: this.eventList}));
            });
        }

    },

    updateDB: function () {
        if (this.collection.length > 0) {
            localStorage.setItem('tracked-items', JSON.stringify(this.collection));
        } else {
            localStorage.clear();
        }
    },

    addItem: function (item) {

        this.eventList.trigger('clearSearchResults');

        this.collection.add(item.model);

        if (this.collection.length === 1) {
            $('#app').append(this.render().el);
        }

        var trackedItemView = new TrackedItemView({model: item.model, eventList: this.eventList});

        $('.total').remove();

        this.$el.find('#tracked-item-list').append(this.totalTemplate(this));

        $(trackedItemView.render().el).insertBefore('.total');

    },

    removeItem: function (item) {

        this.collection.remove(item.model);

        $('.total').remove();
        item.$el.remove();

        if (this.collection.length === 0) {
            $('#app').append(this.render().el);

        } else {
            this.$el.find('#tracked-item-list').append(this.totalTemplate(this));
        }

    },

    sumCalories: function () {

        var sum = 0;
        this.collection.each(function (item) {
            sum += item.get('calories');
        });

        return sum.toFixed(2);

    }

});