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
  along with Waistline.  If not, see <http://www.gnu.org/licenses/>.
*/

import * as Utils from "/www/assets/js/utils.js";

const s = {
  item: undefined,
  origin: undefined,
  allNutriments: false,
  linked: true,
  el: {},
  lastPage: ""
};

function init(context) {

  if (context) {

    if (context.item) {
      s.item = context.item;
      s.linked = true;
    } else
      s.linked = false; //Unlinked by default for adding new items

    s.origin = context.origin;
  }

  getComponents();
  bindUIActions();
  updateTitle();
  renderNutritionFields(s.item);
  setComponentVisibility(s.origin);
  setLinkButtonIcon();

  if (s.item)
    populateFields(s.item);

  if (s.item && s.item.category !== undefined)
    populateCategoryField(s.item);
}

function getComponents() {
  s.el.title = document.querySelector(".page[data-name='food-editor'] #title");
  s.el.link = document.querySelector(".page[data-name='food-editor'] #link");
  s.el.submit = document.querySelector(".page[data-name='food-editor'] #submit");
  s.el.name = document.querySelector(".page[data-name='food-editor'] #name");
  s.el.brand = document.querySelector(".page[data-name='food-editor'] #brand");
  s.el.categoryContainer = document.querySelector(".page[data-name='food-editor'] #category-container");
  s.el.category = document.querySelector(".page[data-name='food-editor'] #category");
  s.el.unit = document.querySelector(".page[data-name='food-editor'] #unit");
  s.el.portion = document.querySelector(".page[data-name='food-editor'] #portion");
  s.el.quantityContainer = document.querySelector(".page[data-name='food-editor'] #quantity-container");
  s.el.quantity = document.querySelector(".page[data-name='food-editor'] #quantity");
  s.el.fab = document.querySelector(".page[data-name='food-editor'] #add-photo");
}

function bindUIActions() {
  s.el.submit.addEventListener("click", (e) => {
    returnItem(s.item, s.origin);
  });

  s.el.portion.addEventListener("change", (e) => {
    changeServing(s.item, "portion", e.target.value);
  });

  s.el.quantity.addEventListener("change", (e) => {
    changeServing(s.item, "quantity", e.target.value);
  });

  s.el.link.addEventListener("click", (e) => {
    s.linked = 1 - s.linked;
    setLinkButtonIcon();
  });
}

function setComponentVisibility(origin) {
  if (origin !== "foodlist") {
    s.el.name.disabled = true;
    s.el.brand.disabled = true;
    s.el.unit.disabled = true;
    s.el.link.style.display = "none";
    s.linked = true;
    s.el.quantityContainer.style.display = "block";

    s.el.name.style.color = "grey";
    s.el.brand.style.color = "grey";
    s.el.unit.style.color = "grey";
  } else {
    s.el.link.style.display = "block";
    s.el.quantityContainer.style.display = "none";
  }

  if (s.item == undefined)
    s.el.fab.style.display = "block";
  else
    s.el.fab.style.display = "none";

  if (s.item && s.item.category !== undefined)
    s.el.categoryContainer.style.display = "block";
  else
    s.el.categoryContainer.style.display = "none";
}

function setLinkButtonIcon() {
  if (s.linked)
    s.el.link.innerHTML = "link";
  else
    s.el.link.innerHTML = "link_off";
}

function updateTitle() {
  if (!s.item) s.el.title.innerHTML = waistline.strings["add-new-item"] || "Add New Item";
}

/* Nutrition fields are dynamically created for the nutriments of the item */
function renderNutritionFields(item) {

  const nutriments = waistline.nutriments;
  const units = waistline.nutrimentUnits;

  if (item && item.nutrition.kilojoules == undefined)
    item.nutrition.kilojoules = Math.round(item.nutrition.calories * 4.1868);

  let ul = document.getElementById("nutrition");
  ul.innerHTML = ""; //Clear old form 

  for (let k of nutriments) {

    if (s.origin == "foodlist" || (item && item.nutrition[k])) { // All nutriments or only items nutriments
      let li = document.createElement("li");
      li.className = "item-content item-input";
      ul.appendChild(li);

      let innerDiv = document.createElement("div");
      innerDiv.className = "item-inner";
      li.appendChild(innerDiv);

      let titleDiv = document.createElement("div");
      titleDiv.className = "item-input item-label";
      let text = waistline.strings[k] || k; //Localize
      titleDiv.innerText = (text.charAt(0).toUpperCase() + text.slice(1)).replace("-", " ") + " (" + (units[k] || "g") + ")";
      innerDiv.appendChild(titleDiv);

      let inputWrapper = document.createElement("div");
      inputWrapper.className = "item-input-wrap";
      innerDiv.appendChild(inputWrapper);

      let input = document.createElement("input");
      input.id = k;
      input.type = "number";
      input.step = "0.01";
      input.min = "0";
      input.name = k;

      if (item) {
        input.value = Math.round(item.nutrition[k] * 100) / 100 || 0;
        input.oldValue = input.value;
      } else {
        input.value = 0;
      }

      input.addEventListener("change", function() {
        if (this.oldValue == 0) this.oldValue = this.value;
        if (this.value == 0) this.oldValue = 0;
        changeServing(item, k, this.value);
      });
      inputWrapper.appendChild(input);
    }
  }
}

function populateCategoryField(item) {
  //Category 
  const mealNames = waistline.Settings.get("diary", "meal-names");
  s.el.category.innerHTML = "";

  mealNames.forEach((x, i) => {
    if (x != "" && x != undefined) {
      let option = document.createElement("option");
      option.value = i;
      option.text = x;
      if (i == item.category) option.setAttribute("selected", "");
      s.el.category.append(option);
    }
  });
}

function populateFields(item) {
  s.el.name.value = Utils.tidyText(item.name, 200);
  s.el.brand.value = Utils.tidyText(item.brand, 200);
  s.el.unit.value = item.unit;

  //Portion (serving size)
  if (item.portion != +undefined) {
    s.el.portion.value = parseFloat(item.portion);
    s.el.portion.oldValue = parseFloat(item.portion);
  } else {
    s.el.portion.setAttribute("placeholder", "N/A");
    s.el.portion.disabled = true;
  }

  //Quantity (number of servings)
  s.el.quantity.value = item.quantity || 1;
  s.el.quantity.oldValue = s.el.quantity.value;
}

function changeServing(item, field, newValue) {

  if (s.linked) {

    let multiplier;
    let oldValue;

    if (field == "portion" || field == "quantity")
      oldValue = item[field];
    else
      oldValue = document.querySelector("#food-edit-form #" + field).oldValue;

    if (oldValue > 0 && newValue > 0) {
      let newQuantity = s.el.quantity.value;

      if (field == "portion" || field == "quantity") {
        let newPortion = s.el.portion.value;
        multiplier = (newPortion / item.portion) * (newQuantity / (item.quantity || 1));
      } else {
        multiplier = (newValue / oldValue) / (newQuantity / (item.quantity || 1));
        s.el.portion.value = Math.round(item.portion * multiplier * 100) / 100;
      }

      //Nutrition 
      const nutriments = waistline.nutriments;
      for (let k of nutriments) {
        if (k != field) {
          let input = document.querySelector("#food-edit-form #" + k);
          if (input) {
            input.value = Math.round(input.oldValue * multiplier * 100) / 100 || 0;
          }
        }
      }
    }
  }
}

function returnItem(data, origin) {

  if (f7.input.validateInputs("#food-edit-form") == true) {

    let item = {};
    item.portion = s.el.portion.value;

    if (data !== undefined) {
      item.id = data.id;
      item.type = data.type;

      if (data.index !== undefined)
        item.index = data.index;

      if (data.quantity !== undefined)
        item.quantity = s.el.quantity.value;

      if (data.category !== undefined)
        item.category = s.el.category.value;
    }

    if (origin == "foodlist") {

      let now = new Date();
      let today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      item.dateTime = today;

      const nutriments = waistline.nutriments;
      const inputs = document.querySelectorAll("#food-edit-form input:not(#quantity)");

      const unit = s.el.unit.value;

      if (unit !== undefined && unit != "")
        item.unit = unit;

      item.nutrition = {};

      inputs.forEach((x, i) => {

        let id = x.id;
        let value = x.value;

        if (value) {
          if (nutriments.indexOf(id) != -1) //Nutriments
            item.nutrition[id] = parseFloat(value);
          else
            item[id] = value;
        }
      });
    }

    f7.data.context = {
      item: item
    };
    f7.views.main.router.back();
  }
}

document.addEventListener("page:init", function(event) {
  if (event.target.matches(".page[data-name='food-editor']")) {
    let context = f7.views.main.router.currentRoute.context;
    init(context);
  }
});