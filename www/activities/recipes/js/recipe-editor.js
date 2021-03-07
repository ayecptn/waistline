/*
  Copyright 2021 David Healey

  This file is part of Waistline.

  Waistline is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Waistline is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with app.  If not, see <http://www.gnu.org/licenses/>.
*/

app.RecipeEditor = {

  recipe: {},
  el: {},

  init: async function(context) {
    app.RecipeEditor.getComponents();

    if (context) {

      // From recipe list
      if (context.recipe) {
        app.RecipeEditor.recipe = context.recipe;
        app.RecipeEditor.populateInputs(context.recipe);
      }

      // From food list
      if (context.items)
        app.RecipeEditor.addItems(context.items);

      // From recipe editor
      if (context.item)
        app.RecipeEditor.replaceListItem(context.item);

      app.RecipeEditor.renderNutrition();
      await app.RecipeEditor.renderItems();
    }

    app.RecipeEditor.bindUIActions();
  },

  getComponents: function() {
    app.RecipeEditor.el.submit = document.querySelector(".page[data-name='recipe-editor'] #submit");
    app.RecipeEditor.el.nameInput = document.querySelector(".page[data-name='recipe-editor'] #name");
    app.RecipeEditor.el.foodlist = document.querySelector(".page[data-name='recipe-editor'] #recipe-food-list");
    app.RecipeEditor.el.fab = document.querySelector(".page[data-name='recipe-editor'] #add-food");
    app.RecipeEditor.el.nutrition = document.querySelector(".page[data-name='recipe-editor'] #recipe-nutrition");
    app.RecipeEditor.el.swiperWrapper = document.querySelector(".page[data-name='recipe-editor'] .swiper-wrapper");
  },

  bindUIActions: function() {

    // Submit
    if (!app.RecipeEditor.el.submit.hasClickEvent) {
      app.RecipeEditor.el.submit.addEventListener("click", (e) => {
        save();
      });
      app.RecipeEditor.el.submit.hasClickEvent = true;
    }

    // Fab
    if (!app.RecipeEditor.el.fab.hasClickEvent) {
      app.RecipeEditor.el.fab.addEventListener("click", (e) => {
        app.f7.data.context = {
          origin: "./recipe-editor/",
          recipe: app.RecipeEditor.recipe
        };

        app.f7.views.main.router.navigate("/foods-meals-recipes/", {
          context: app.f7.data.context
        });
      });
      app.RecipeEditor.el.fab.hasClickEvent = true;
    }
  },

  populateInputs: function(recipe) {
    let inputs = document.querySelectorAll(".page[data-name='recipe-editor'] input, .page[data-name='recipe-editor'] textarea");

    inputs.forEach((x) => {
      if (recipe[x.name] !== undefined)
        x.value = unescape(recipe[x.name]);
    });
  },

  addItems: function(data) {

    let result = app.RecipeEditor.recipe.items;

    data.forEach((x) => {
      let item = {
        id: x.id,
        portion: x.portion,
        quantity: 1,
        type: x.type
      };
      result.push(item);
    });
    app.RecipeEditor.recipe.items = result;
  },

  removeItem: function(item, li) {
    let title = app.strings["confirm-delete-title"] || "Delete";
    let text = app.strings["confirm-delete"] || "Are you sure?";
    let dialog = app.f7.dialog.confirm(text, title, callbackOk);

    function callbackOk() {
      app.RecipeEditor.recipe.items.splice(item.index, 1);
      li.parentNode.removeChild(li);
      renderNutrition();
    }
  },

  save: async function() {

    let data = {};

    if (app.RecipeEditor.recipe.id !== undefined) data.id = app.RecipeEditor.recipe.id;
    if (app.RecipeEditor.recipe.items !== undefined) data.items = app.RecipeEditor.recipe.items;

    let now = new Date();
    data.dateTime = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    let inputs = document.querySelectorAll(".page[data-name='recipe-editor'] input");

    inputs.forEach((x) => {
      if (x.value !== undefined && x.value != "")
        data[x.name] = x.value;
    });

    // Array index should not be saved with items
    if (data.items !== undefined) {
      data.items.forEach((x) => {
        if (x.index !== undefined)
          delete x.index;
      });
    }

    if (app.RecipeEditor.recipe.items.length > 0)
      data.nutrition = await app.FoodsMealsRecipes.getTotalNutrition(app.RecipeEditor.recipe.items);

    dbHandler.put(data, "recipes").onsuccess = () => {
      app.f7.views.main.router.navigate("/foods-meals-recipes/recipes/");
    };
  },

  replaceListItem: function(item) {
    app.RecipeEditor.recipe.items.splice(item.index, 1, item);
  },

  renderNutrition: async function() {
    let now = new Date();
    let nutrition = await app.FoodsMealsRecipes.getTotalNutrition(app.RecipeEditor.recipe.items);

    let swiper = app.f7.swiper.get("#recipe-nutrition-swiper");
    app.RecipeEditor.el.swiperWrapper.innerHTML = "";
    app.FoodsMealsRecipes.renderNutritionCard(nutrition, now, swiper);
  },

  renderItems: function() {
    return new Promise(async function(resolve, reject) {
      // Render the food list 
      app.RecipeEditor.el.foodlist.innerHTML = "";

      app.RecipeEditor.recipe.items.forEach(async (x, i) => {
        x.index = i;
        app.FoodsMealsRecipes.renderItem(x, app.RecipeEditor.el.foodlist, false, undefined, app.RecipeEditor.removeItem);
      });

      resolve();
    });
  }
};

document.addEventListener("page:init", function(event) {
  if (event.detail.name == "recipe-editor") {
    let context = app.f7.data.context;
    app.f7.data.context = undefined;

    // Clear old recipe
    app.RecipeEditor.recipe = {
      items: []
    };

    app.RecipeEditor.init(context);
  }
});

document.addEventListener("page:reinit", function(event) {
  if (event.detail.name == "recipe-editor") {
    let context = app.f7.data.context;
    app.f7.data.context = undefined;
    app.RecipeEditor.init(context);
  }
});