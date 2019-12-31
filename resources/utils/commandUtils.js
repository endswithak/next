const layerToBase64 = (layer, id, sketch) => {
    // create image buffer from layer
    const buffer = sketch.export(layer, {
        formats: 'png',
        output: false,
        ['save-for-web']: true
    });
    // create image from buffer data
    const bufferImg = new sketch.Image({
        image: buffer
    });
    // return base64 image
    return createBase64Image(bufferImg.image, id);
};
const gradientToBase64 = (layer, id, sketch) => {
    // get enabled gradients
    const activeGradients = layer.style.fills.filter((fill) => {
        return fill.enabled && fill.fillType === 'Gradient';
    });
    // get top gradient fill
    const topGradient = activeGradients[activeGradients.length - 1];
    // only keep layer gradient styles
    layer.style.fills = [topGradient];
    layer.style.borders = [];
    layer.style.shadows = [];
    layer.style.innerShadows = [];
    // turn layer into base64
    return layerToBase64(layer, id, sketch);
};
const createBase64Image = (image, id) => {
    let newImageBase64 = image.nsdata.base64EncodedStringWithOptions(0);
    let newImage = 'data:image/png;base64,' + newImageBase64;
    return {
        id: id,
        src: newImage
    };
};
const base64ImageBatch = (images) => {
    return images.map((image) => {
        return createBase64Image(image, image.id);
    });
};
export const getSelectedArtboard = (selectedLayers) => {
    return selectedLayers.layers.find((layer) => {
        return layer.type === 'Artboard' && layer.selected;
    });
};
const detachSymbols = (layers) => {
    if (layers.length > 0) {
        layers.forEach((layer) => {
            if (layer.type === 'Group') {
                detachSymbols(layer.layers);
            }
            else if (layer.type === 'SymbolInstance') {
                layer.detach({
                    recursively: true
                });
            }
        });
    }
};
const getLayerImages = (layers, images = []) => {
    layers.forEach((layer) => {
        if (layer.type === 'Image') {
            images.push(layer.image);
        }
    });
    return images;
};
const getFillImages = (layers, images = []) => {
    layers.forEach((layer) => {
        if (layer.style.fills.length > 0) {
            layer.style.fills.forEach((fill) => {
                if (fill.pattern.image !== null && fill.enabled) {
                    images.push(fill.pattern.image);
                }
            });
        }
    });
    return images;
};
const generateBase64Gradients = (layers, sketch, images = []) => {
    layers.forEach((layer) => {
        if (layer.style.fills.length > 0 && !layer.hidden) {
            // check if fills contain any enabled gradients
            const hasActiveGradient = layer.style.fills.some((fill) => {
                return fill.fillType === 'Gradient' && fill.enabled;
            });
            // generate gradient base64
            if (hasActiveGradient) {
                // create duplicate
                const layerDuplicate = layer.duplicate();
                // create base64 from duplicate layer
                const base64Gradient = gradientToBase64(layerDuplicate, layer.id, sketch);
                // push base64 gradient to images
                images.push(base64Gradient);
                // remove duplicate
                layerDuplicate.remove();
            }
        }
    });
    return images;
};
const generateBase64Images = (layers) => {
    // get layers to turn into base64
    const layerImages = getLayerImages(layers);
    const fillImages = getFillImages(layers);
    // generate base64 images from layers
    const base64LayerImages = base64ImageBatch(layerImages);
    const base64FillImages = base64ImageBatch(fillImages);
    // return final base64 image store
    return [...base64LayerImages, ...base64FillImages];
};
export const validSelection = (selection) => {
    const notEmpty = selection.count() == 1;
    if (notEmpty && selection.firstObject().class() == 'MSArtboardGroup') {
        return true;
    }
    else {
        return false;
    }
};
const flattenGroups = (layers) => {
    if (layers.length > 0) {
        layers.forEach((layer) => {
            if (layer.type === "Group") {
                layer.sketchObject.ungroup();
                flattenGroups(layer.layers);
            }
        });
    }
};
export const removeHiddenLayers = (layers) => {
    if (layers.length > 0) {
        layers.forEach((layer) => {
            const hidden = layer.hidden;
            const transparent = layer.style.opacity === 0;
            if (layer.type === 'Group') {
                if (hidden || transparent) {
                    layer.remove();
                }
                else {
                    removeHiddenLayers(layer.layers);
                }
            }
            else {
                if (hidden || transparent) {
                    layer.remove();
                }
            }
        });
    }
};
export const flattenShapes = (layers, sketch) => {
    if (layers.length > 0) {
        layers.forEach((layer, index) => {
            if (layer.type === 'Group') {
                flattenShapes(layer.layers, sketch);
            }
            else if (layer.type === 'Shape') {
                // create svg buffer
                const buffer = sketch.export(layer, {
                    formats: 'svg',
                    output: false
                });
                // create layer from buffer
                const shapeGroup = sketch.createLayerFromData(buffer, 'svg');
                // set group layer position to match original layer
                shapeGroup.layers.forEach((svg) => {
                    svg.frame.x = layer.frame.x;
                    svg.frame.y = layer.frame.y;
                });
                // splice out old layer, splice in new group
                layers.splice(index, 1, shapeGroup);
            }
        });
    }
};
export const getShapeSVGs = (layers, svgs = []) => {
    layers.forEach((layer) => {
        if (layer.type === 'Shape') {
            layer.layers.forEach((shapePath) => {
                const path = shapePath.getSVGPath();
                svgs.push({
                    parentId: layer.id,
                    shapePath: shapePath,
                    svgPath: path
                });
            });
        }
    });
    return svgs;
};
const maskGroupToImageLayer = (maskGroup, sketch) => {
    // create image buffer from layer
    const buffer = sketch.export(maskGroup, {
        formats: 'png',
        output: false,
        ['save-for-web']: true
    });
    // create image layer from buffer data
    const imageLayer = new sketch.Image({
        name: 'mask-image',
        image: buffer
    });
    // set dims
    imageLayer.frame.width = maskGroup.frame.width;
    imageLayer.frame.height = maskGroup.frame.height;
    // return image layer
    return imageLayer;
};
export const masksToImages = (layers, sketch) => {
    if (layers.length > 0) {
        layers.forEach((layer) => {
            if (layer.type === 'Group') {
                masksToImages(layer.layers, sketch);
            }
            else if (layer.sketchObject.hasClippingMask() && layer.parent.type === 'Group') {
                const imageLayer = maskGroupToImageLayer(layer.parent, sketch);
                layer.parent.layers.unshift(imageLayer);
                layer.parent.layers.forEach((layer, index) => {
                    if (index !== 0) {
                        layer.remove();
                    }
                });
            }
        });
    }
};
export const roundDims = (layers) => {
    layers.forEach((layer) => {
        layer.frame.x = Math.round(layer.frame.x);
        layer.frame.y = Math.round(layer.frame.y);
        layer.frame.width = Math.round(layer.frame.width);
        layer.frame.height = Math.round(layer.frame.height);
    });
};
export const getArtboard = (sketch) => {
    let document = sketch.getSelectedDocument();
    let selectedLayers = document.selectedLayers;
    let artboard = getSelectedArtboard(selectedLayers);
    // duplicate native artboard
    let artboardDuplicate = artboard.duplicate();
    // reset duplicated artboard position
    artboardDuplicate.frame.x = 0;
    artboardDuplicate.frame.y = 0;
    // detach all symbols from duplicated artboard, returns layer groups
    detachSymbols(artboardDuplicate.layers);
    // remove hidden layers
    removeHiddenLayers(artboardDuplicate.layers);
    // get masks
    masksToImages(artboardDuplicate.layers, sketch);
    // flatten shapes for future svgs
    flattenShapes(artboardDuplicate.layers, sketch);
    // flatten all groups within duplicated artboard
    flattenGroups(artboardDuplicate.layers);
    // round dims
    roundDims(artboardDuplicate.layers);
    // return final artboard
    return artboardDuplicate;
};
export const getStore = (sketch) => {
    // get artboard
    let artboard = getArtboard(sketch);
    // get images
    let images = generateBase64Images(artboard.layers);
    let gradients = generateBase64Gradients(artboard.layers, sketch);
    let svgs = getShapeSVGs(artboard.layers);
    // remove duplicate artboard
    artboard.remove();
    // return final store
    return {
        artboard: artboard,
        images: [...images, ...gradients],
        svgs: svgs
    };
};
// export const shapesToImages = (layers: any, sketch: any) => {
//   layers.forEach((layer: any, index: number) => {
//     if (layer.type === 'Shape') {
//       // create image layer
//       const imageLayer = layerToImageLayer(layer, sketch);
//       // push image layer to original layer index
//       layers.splice(index, 0, imageLayer);
//       // remove original layer
//       layer.remove();
//     }
//   });
// }
// const layerToImageLayer = (layer: any, sketch: any) => {
//   // create image buffer from layer
//   const buffer = sketch.export(layer, {
//     formats: 'png',
//     output: false,
//     ['save-for-web']: true
//   });
//   // create image layer from buffer data
//   const imageLayer = new sketch.Image({
//     image: buffer
//   });
//   // set image layer frame and index to original layer
//   imageLayer.frame = layer.frame;
//   // return image layer
//   return imageLayer;
// };
