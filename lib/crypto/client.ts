"use client";

import { bytesToHex, hexToBytes, keccak256 } from "viem";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export type EncryptedMemoryEnvelope = {
  version: 1;
  algorithm: "AES-GCM";
  iv: string;
  aad: string;
  ciphertext: string;
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function assertKeyHex(keyHex: string) {
  if (!/^0x[a-fA-F0-9]{64}$/.test(keyHex)) {
    throw new Error("Vault key must be 32 bytes encoded as 0x-prefixed hex.");
  }
}

function toArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importAesKey(keyHex: string) {
  assertKeyHex(keyHex);
  return crypto.subtle.importKey("raw", toArrayBuffer(hexToBytes(keyHex as `0x${string}`)), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export function generateVaultKeyHex() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function encryptMemory(plaintext: string, keyHex: string, aad: string) {
  const key = await importAesKey(keyHex);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv),
      additionalData: toArrayBuffer(textEncoder.encode(aad)),
    },
    key,
    toArrayBuffer(textEncoder.encode(plaintext)),
  );

  const envelope: EncryptedMemoryEnvelope = {
    version: 1,
    algorithm: "AES-GCM",
    iv: bytesToBase64(iv),
    aad,
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
  };

  const envelopeJson = JSON.stringify(envelope);
  const envelopeBytes = textEncoder.encode(envelopeJson);

  return {
    envelope,
    envelopeJson,
    envelopeBase64: bytesToBase64(envelopeBytes),
    dataHash: keccak256(envelopeBytes),
    ciphertextHash: keccak256(base64ToBytes(envelope.ciphertext)),
  };
}

export async function decryptMemory(envelopeJson: string, keyHex: string) {
  const envelope = JSON.parse(envelopeJson) as EncryptedMemoryEnvelope;
  if (envelope.version !== 1 || envelope.algorithm !== "AES-GCM") {
    throw new Error("Unsupported encrypted memory envelope.");
  }
  const key = await importAesKey(keyHex);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(base64ToBytes(envelope.iv)),
      additionalData: toArrayBuffer(textEncoder.encode(envelope.aad)),
    },
    key,
    toArrayBuffer(base64ToBytes(envelope.ciphertext)),
  );
  return textDecoder.decode(plaintext);
}
