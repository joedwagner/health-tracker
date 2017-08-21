// larger container view for search results list
var SearchResultsView = Backbone.View.extend({

    tagName: 'section',
    id: 'search-results',
    template: _.template($('#search-results-template').html()),
    searchMade: false,
    searching: false,
    searchMessage: '',

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

    // Function that makes a call to Nutritionix API to return user's search results
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

            // reset the view
            self.searchMade = true;
            self.searchMessage = 'Searching...';
            self.$el.remove();
            $('#search').append(self.render().el);

            // Make the request
            $.getJSON(requestUrl, function (results) {

                var item;
                var itemView;
                self.collection = new NutritionItemCollection();

                self.searchMessage = (results.hits.length > 0) ? 'Search Results' : 'No search results found.';

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
                self.searchMessage = 'Unable to reach API. Please try again later.';
                self.$el.remove();
                $('#search').append(self.render().el);
            });
        }
    },

    addItem: function (item) {

        this.collection.add(item.model);

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