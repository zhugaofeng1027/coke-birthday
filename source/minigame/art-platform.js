export const CHEF_SPRITES = {
  cooking: 'assets/birthday-chef.png',
  birthday: 'assets/birthday-chef-party.png',
};

export const useCanvasIngredients = true;

export function createArtCanvas(width, height) {
  const canvas = wx.createCanvas();
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createArtImage() { return wx.createImage(); }
