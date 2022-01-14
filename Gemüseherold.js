// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: apple-alt;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: bus-alt;
class WeekInfo {
  
  constructor(date, harvestId) {
    this.date = date;
    this.harvestId = harvestId;
  }
}

class Vegetable {
  
  constructor(name, producer, info, imageId, iconId, is_additional) {
    this.name = name;
    this.producer = producer;
    this.info = info;
    this.imageId = imageId;
    this.iconId = iconId;
    this.isAdditional = is_additional;
  }
}

const COLOR_GREEN = new Color('#08cc33');
const COLOR_ORANGE = new Color('#F6CA35');
const COLOR_RED = new Color('#d03913');
const COLOR_GREY = new Color('#494949');

const FONT_TITLE = Font.boldSystemFont(12);
const FONT_TEXT = Font.regularSystemFont(12);
const FONT_SMALL_TEXT = Font.regularSystemFont(11);
const FONT_TINY_TEXT = Font.regularSystemFont(9);

const SMALL_SHARE_TYPE = 2;
const NORMAL_SHARE_TYPE = 1;

const DASHBOARD_URL = 'https://app.kartoffelkombinat.de/api/dashboard';
const SHARE_URL = 'https://app.kartoffelkombinat.de/api/shares/';
const IMAGE_URL = 'https://app.kartoffelkombinat.de/api/images/';

const param = args.widgetParameter;
let shareType = NORMAL_SHARE_TYPE;

if (param != null && param.trim().length > 0) {
  if (param === 'klein') {
    shareType = SMALL_SHARE_TYPE;
  }
}

let widget;
let vegetables = null;
let weekInfo = null;

try {
  weekInfo = await getWeekInfo();
  vegetables = await getVegetables(weekInfo.harvestId, shareType);
} catch(error) {
  widget = await createErrorWidget(error);
}

if (vegetables != null) {
  widget = await createWidget(vegetables);
}

if(!config.runsInWidget) {
  await widget.presentSmall();
}

Script.setWidget(widget);
Script.complete();

async function createErrorWidget(error) {
  const widget = new ListWidget();
  const errorWidget = widget.addText(error);
  return widget;
}

async function createWidget(vegetables) {
  const widget = new ListWidget();
  widget.setPadding(10, 15, 10, 10);

  const titleWidget = widget.addText('Gemüseherold');
  titleWidget.font = FONT_TITLE;
  titleWidget.textColor = COLOR_GREEN;

  const weekContainerWidget = widget.addStack();
  weekContainerWidget.layoutHorizontally();
  weekContainerWidget.addSpacer(6);

  const weekWidget = weekContainerWidget.addText(weekInfo.date);
  weekWidget.font = FONT_SMALL_TEXT;
  weekWidget.textColor = COLOR_ORANGE;

  const container = widget.addStack();
  container.layoutHorizontally();

  container.addSpacer(6);
  
  const stack1 = container.addStack();
  stack1.layoutVertically();

  container.addSpacer(3);

  const stack2 = container.addStack();
  stack2.layoutVertically();
  
  if (vegetables.length > 0) {
    for (let i = 0; i < vegetables.length && i < 8; i++) {
      const vegetable = vegetables[i];      

      let name = vegetable.name;
      const producer = vegetable.producer;
      const info = vegetable.info;
      const imageId = vegetable.imageId;
      const iconId = vegetable.iconId;
      const isAdditional = vegetable.isAdditional;

      const image = await getImage(iconId);
      const imageWidget = stack1.addImage(image);
      imageWidget.imageSize = new Size(15, 15);
      
      if (isAdditional === 1 && info) {
        name += ' (' + info + ')';
      }

      const vegetableNameWidget = stack2.addText(name);
      vegetableNameWidget.font = FONT_TEXT;
      vegetableNameWidget.lineLimit = 1;

      if (isAdditional === 1) {
        vegetableNameWidget.textColor = COLOR_GREY;
      }

      stack2.addSpacer(1);
    }
  } else {
    widget.addSpacer();
    const noVegetablesWidget = widget.addText('Kein Gemüse! 😱');
    noVegetablesWidget.font = FONT_TEXT;
    noVegetablesWidget.textColor = COLOR_RED;
    noVegetablesWidget.centerAlignText();
  }
  
  widget.addSpacer();

  const footerWidget = widget.addStack();
  footerWidget.layoutHorizontally();
  footerWidget.addSpacer();
    
  const dateFormatter = new DateFormatter();
  dateFormatter.useShortDateStyle();
  dateFormatter.useShortTimeStyle();
    
  const updated = dateFormatter.string(new Date(Date.now()));
  const updatedWidget = footerWidget.addText(updated);
  
  updatedWidget.font = FONT_TINY_TEXT;
  updatedWidget.textColor = COLOR_GREY;
  updatedWidget.rightAlignText();
  
  return widget;
}

async function getWeekInfo() {
  
  const url = DASHBOARD_URL;
  const request = new Request(url);

  let result = null;

  try {
    result = await request.loadJSON();
  } catch (error) {
    throw 'Es ist ein Fehler aufgetreten 😕';
  }
  
  if (result.next && result.next.date && result.next.harvest_id) {
    return new WeekInfo(result.next.date, result.next.harvest_id);
  } else if (result.this) {
    return new WeekInfo(result.this.date, result.this.harvest_id);
  }
  
  throw 'Info konnte nicht geladen werden!';
}
  
async function getVegetables(harvestId, shareType) {
  
  const url = SHARE_URL + shareType + '/' + harvestId;
  const request = new Request(url);

  let result = null;

  try {
    result = await request.loadJSON();
  } catch (error) {
    throw 'Es ist ein Fehler aufgetreten 😕';
  }
  
  const vegetables = [];
  
  if (result.crops) {
    for (let i in result.crops) {
      const vegetable = result.crops[i];
      const name = vegetable.name;
      const producer = vegetable.producer;
      const info = vegetable.info;
      const imageId = vegetable.image.id;
      const iconId = vegetable.icon.id;
      const isAdditional = vegetable.is_additional;
      
      vegetables.push(new Vegetable(name, producer, info, imageId, iconId, isAdditional));
    }
  }
  
  return vegetables;
}

async function getImage(imageId) {
    let fileManager = FileManager.local();
    let dir = fileManager.documentsDirectory();
    let path = fileManager.joinPath(dir, imageId + '.png');

    if (fileManager.fileExists(path)) {
        return fileManager.readImage(path);
    } else {
        try {
          let iconImage = await loadImage(IMAGE_URL + imageId);
          fileManager.writeImage(path, iconImage);
          return iconImage;
        } catch (err) {
          throw err;
        }
    }
}

async function loadImage(imageUrl) {
  const req = new Request(imageUrl);
  try {
    return await req.loadImage();
  } catch (err) {
    throw err;
  }
}