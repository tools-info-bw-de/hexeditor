<script setup>
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap"
import { Popover } from "bootstrap"

import { reactive, onBeforeMount, computed, onMounted } from "vue"

const state = reactive({
  text: '',
  hex: '',
  binary: '',
  binaryInvalid: false,
  hexInvalid: false,
})


onBeforeMount(() => {
  //
});

onMounted(() => {
  const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
  const popoverList = [...popoverTriggerList].map(popoverTriggerEl => new Popover(popoverTriggerEl, {
    html: true,
    sanitize: false,
    trigger: "focus",
  }))
})



function formatBinary() {
  if (state.binary.length === 0) {
    return
  }
  // nach jeder 8. Stelle ein Leerzeichen einfügen
  state.binary = state.binary.replace(/\s/g, '').match(/.{1,8}/g).join(' ')

  if (state.binary.replace(/[01\s]/g, '').length > 0) {
    state.binaryInvalid = true;
    return;
  }
  state.binaryInvalid = false;
}


const binaryToHexAndText = () => {
  formatBinary();

  let hexResult = '';
  let textResult = '';

  let cleanBinary = state.binary.replace(/\s/g, '')

  // wenn länge exklusive leerzeichen nicht vielfaches von 8, dann abbrechen
  if (cleanBinary.length % 8 !== 0) {
    return;
  }

  const binaryValues = cleanBinary.match(/.{1,8}/g) || [];

  for (let i = 0; i < binaryValues.length; i++) {
    const decimal = parseInt(binaryValues[i], 2);
    hexResult += decimal.toString(16).padStart(2, '0') + ' ';
    textResult += String.fromCharCode(decimal);
  }

  state.hex = hexResult.trim();
  state.text = textResult;
};

function formatHex() {
  if (state.hex.length === 0) {
    return
  }
  // nach jeder 2. Stelle ein Leerzeichen einfügen
  state.hex = state.hex.replace(/\s/g, '').match(/.{1,2}/g).join(' ')

  //prüfe auf illegale hex zeichen
  if (state.hex.replace(/[0-9a-fA-F\s]/g, '').length > 0) {
    state.hexInvalid = true;
    return;
  }
  state.hexInvalid = false;
}

const hexToBinaryAndText = () => {
  formatHex();

  let binaryResult = '';
  let textResult = '';

  const hexValues = state.hex.split(' ');

  for (let i = 0; i < hexValues.length; i++) {
    const decimal = parseInt(hexValues[i], 16);
    binaryResult += decimal.toString(2).padStart(8, '0') + ' ';
    textResult += String.fromCharCode(decimal);
  }

  state.binary = binaryResult.trim();
  state.text = textResult;
};

const textToBinaryAndHex = () => {
  let binaryResult = '';
  let hexResult = '';

  for (let i = 0; i < state.text.length; i++) {
    binaryResult += state.text.charCodeAt(i).toString(2).padStart(8, '0') + ' ';
    hexResult += state.text.charCodeAt(i).toString(16).padStart(2, '0') + ' ';
  }

  state.binary = binaryResult.trim();
  state.hex = hexResult.trim();
};



</script>

<template>
  <button type="button" class="infoBtn btn btn-outline-dark btn-sm" data-bs-container="body" data-bs-toggle="popover"
    data-bs-placement="bottom"
    data-bs-content='Quellcode auf <a href="https://github.com/tools-info-bw-de/hexeditor" target="_blank">github</a>!<br>§ MIT - Marco Kümmel'>info</button>

  <h1 class="mb-4">Hex-Editor</h1>
  <div class="row">
    Dropdown Ascii/Ansi
  </div>
  <div class="container-xxl">
    <div class="row mt-3">
      <div class="col-md-8 col-sm-12 tableLayout">
        <h3>Binär</h3>
        <textarea class="form-control" v-model="state.binary" @input="binaryToHexAndText"></textarea>

        <div v-if="state.binaryInvalid" class="alert alert-danger mt-2" role="alert">
          Binäreingabe ungültig. Nur 0 und 1 erlaubt!
        </div>
      </div>
      <div class="col-md-2 col-sm-12 tableLayout">
        <h3>Hexadezimal</h3>
        <textarea class="form-control" v-model="state.hex" @input="hexToBinaryAndText"></textarea>

        <div v-if="state.hexInvalid" class="alert alert-danger mt-2" role="alert">
          Hexadezimaleingabe ungültig. Nur 0-9 und a-f erlaubt!
        </div>
      </div>
      <div class="col-md-2 col-sm-12 tableLayout">
        <h3>Text</h3>
        <textarea class="form-control" v-model="state.text" @input="textToBinaryAndHex"></textarea>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media screen and (max-width: 768px) {
  .tableLayout {
    height: inherit;
    margin-top: 10px;
  }
}

@media screen and (min-width: 768px) {
  .tableLayout {
    height: 80vh;
  }
}

.tableLayout {
  border: 1px solid rgb(197, 197, 197);
  padding: 10px;
  text-align: center;
}

textarea {
  font-family: monospace;
  height: calc(100% - 40px);
}

.infoBtn {
  position: absolute;
  top: 10px !important;
  right: 10px !important;
}
</style>
