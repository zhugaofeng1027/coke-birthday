export const CHEF_SPRITES = {
  cooking: new URL('./assets/birthday-chef.webp', import.meta.url).href,
  birthday: new URL('./assets/birthday-chef-party.webp', import.meta.url).href,
};

export const useCanvasIngredients = false;

export function createArtCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createArtImage() { return new Image(); }
