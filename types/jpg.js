"use strict";

function isJPG (buffer) {
  var SOIMarker = buffer.toString("hex", 0, 2);

  return ("ffd8" === SOIMarker);
}

function extractSize (buffer, i) {
  return {
    "height" : buffer.readUInt16BE(i),
    "width" : buffer.readUInt16BE(i + 2)
  };
}

function validateBuffer (buffer, i) {
  if (i > buffer.length) {
    throw new TypeError("Corrupt JPG, exceeded buffer limits");
  }
  if (buffer[i] !== 0xFF) {
    throw new TypeError("Invalid JPG, marker table corrupted");
  }
}

function calculate (buffer) {
  buffer = buffer.slice(4);

  var i, next;
  while (buffer.length) {
    i = buffer.readUInt16BE(0);
    
    validateBuffer(buffer, i);
    
    next = buffer[i + 1];
    if (next === 0xC0 || next === 0xC2) {
      return extractSize(buffer, i + 5);
    }
    
    buffer = buffer.slice(i + 2);
  }

  throw new TypeError("Invalid JPG, no size found");
}

module.exports = {
  "detect": isJPG,
  "calculate": calculate
};
