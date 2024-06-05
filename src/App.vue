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
  asciiTable: generateAsciiTable(),
  showASCII: false,
})


onBeforeMount(() => {
  //generateAsciiTable()
});

const asciiTableParts = computed(() => {
  let parts = [];
  let partSize = Math.ceil(state.asciiTable.length / 3);
  for (let i = 0; i < 3; i++) {
    parts.push(state.asciiTable.slice(i * partSize, (i + 1) * partSize));
  }

  //print length of each part
  console.log(parts.map(part => part.length));
    
  return parts;
})

function generateAsciiTable() {
      let table = [];
      
      // Steuerzeichen 0 bis 31
      let controlChars = [
        'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
        'BS', 'HT', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
        'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
        'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US'
      ];
      for (let i = 0; i < controlChars.length; i++) {
        let character = controlChars[i];
        let binary = i.toString(2).padStart(8, '0');
        let hex = i.toString(16).toUpperCase();
        table.push({ character, binary, hex });
      }

      // Zeichen 32 bis 126 (lesbare Zeichen)
      for (let i = 32; i <= 126; i++) {
        let character = String.fromCharCode(i);
        let binary = i.toString(2).padStart(8, '0');
        let hex = i.toString(16).toUpperCase();
        table.push({ character, binary, hex });
      }

      // letztes Steuerzeichen
      table.push({ character: 'DEL', binary: '11111111', hex: '7F' })

      // leeres Feld, damit Tabelleninhalt durch 3 teilbar ist
      table.push({ character: '\u00A0', binary: ' ', hex: ' ' });

      return table;
}

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
}


const binaryToHexAndText = () => {
  if (state.binary.replace(/\s/g, '').length === 0) {
    state.hex = '';
    state.text = '';
    state.binaryInvalid = false;
    return;
  }

  //prüfe auf illegale binäre Zeichen
  if (state.binary.replace(/[01\s]/g, '').length > 0) {
    state.binaryInvalid = true;
    return;
  }
  state.binaryInvalid = false;

  let cleanBinary = state.binary.replace(/\s/g, '')

  // nur formatieren, wenn ich nicht gerade bearbeite (= wenn Länge Vielfaches von 8)
  if (cleanBinary.length % 8 !== 0) {
    return
  }
  formatBinary();

  let hexResult = '';
  let textResult = '';

  const binaryValues = cleanBinary.match(/.{1,8}/g) || [];

  for (let i = 0; i < binaryValues.length; i++) {
    const decimal = parseInt(binaryValues[i], 2);
    hexResult += decimal.toString(16).padStart(2, '0') + ' ';
    textResult += String.fromCharCode(decimal);
  }

  state.hex = hexResult.trim();
  state.text = textResult;

  state.binaryInvalid = false;
  state.hexInvalid = false;
};

function formatHex() {
  if (state.hex.length === 0) {
    return
  }
  // nach jeder 2. Stelle ein Leerzeichen einfügen
  state.hex = state.hex.replace(/\s/g, '').match(/.{1,2}/g).join(' ')
}

const hexToBinaryAndText = () => {
  if (state.hex.replace(/\s/g, '').length === 0) {
    state.binary = '';
    state.text = '';
    state.hexInvalid = false;
    return;
  }

  //prüfe auf illegale hex zeichen
  if (state.hex.replace(/[0-9a-fA-F\s]/g, '').length > 0) {
    state.hexInvalid = true;
    return;
  }
  state.hexInvalid = false;

  if (state.hex.replace(/\s/g, '').length % 2 !== 0) {
    return
  }
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

  state.binaryInvalid = false;
  state.hexInvalid = false;
};

const textToBinaryAndHex = () => {
  if (state.text.length === 0) {
    state.binary = '';
    state.hex = '';
    return;
  }

  let binaryResult = '';
  let hexResult = '';

  for (let i = 0; i < state.text.length; i++) {
    binaryResult += state.text.charCodeAt(i).toString(2).padStart(8, '0');
    hexResult += state.text.charCodeAt(i).toString(16).padStart(2, '0');
  }

  state.binary = binaryResult.trim().match(/.{1,8}/g).join(' ');
  state.hex = hexResult.trim().match(/.{1,2}/g).join(' ');

  state.binaryInvalid = false;
  state.hexInvalid = false;
};



</script>

<template>
  <button type="button" class="infoBtn btn btn-outline-dark btn-sm" data-bs-container="body" data-bs-toggle="popover"
    data-bs-placement="bottom"
    data-bs-content='Quellcode auf <a href="https://github.com/tools-info-bw-de/hexeditor" target="_blank">github</a>!<br>§ MIT - Marco Kümmel'>info</button>

  <h1 class="mb-4">Hex-Editor</h1>
  <div class="container-xxl">
    <div class="row mt-3">
      <div class="col-md-8 col-sm-12 tableLayout">
        <h3>Binär</h3>
        <textarea id="binaryTextarea" class="form-control" v-model="state.binary" @input="binaryToHexAndText"></textarea>

        <div v-if="state.binaryInvalid" class="alert alert-danger mt-2" role="alert">
          Binäreingabe ungültig. Nur 0 und 1 erlaubt!
        </div>
      </div>
      <div class="col-md-2 col-sm-12 tableLayout">
        <h3>Hexadezimal</h3>
        <textarea id="hexTextarea" class="form-control" v-model="state.hex" @input="hexToBinaryAndText"></textarea>

        <div v-if="state.hexInvalid" class="alert alert-danger mt-2" role="alert">
          Hexadezimaleingabe ungültig. Nur 0-9 und a-f erlaubt!
        </div>
      </div>
      <div class="col-md-2 col-sm-12 tableLayout">
        <h3>Text</h3>
        <textarea id="textTextarea" class="form-control" v-model="state.text" @input="textToBinaryAndHex"></textarea>
      </div>
    </div>


    <div class="form-check form-switch mt-3" id="showASCIISwitch">
      <input v-model="state.showASCII" class="form-check-input" type="checkbox" role="switch" id="showASCII">
      <label class="form-check-label user-select-none" for="showASCII">Zeige ASCII-Tabelle</label>
    </div>


    <div class="row" v-if="state.showASCII">
      <div class="table-container">
        <table class="table table-striped" v-for="(tablePart, index) in asciiTableParts" :key="index">
          <thead>
            <tr>
              <th>Binär</th>
              <th>Hex</th>
              <th>Zeichen</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="char in tablePart" :key="char.character">
              <td class="binaryTable">{{ char.binary }}</td>
              <td class="hexTable">{{ char.hex }}</td>
              <td class="characterTable">{{ char.character }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table tr {
  line-height: 1;
}

#showASCIISwitch {
  text-align: left;
}

.table-container > table:not(:last-child) {
  border-right: 2px solid #000; 
}

.table-container > table {
  flex: 1 0 300px;
}

.table-container {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

#binaryTextarea, .binaryTable {
  background-color: #d1fad1;
}

#hexTextarea, .hexTable {
  background-color: #ffcece;
}

#textTextarea, .characterTable {
  background-color: #cff5ff;
}

@media screen and (max-width: 768px) {
  .tableLayout {
    height: inherit;
    margin-top: 10px;
  }

  .table-container > table {
    flex: 1 0 100%;
  }
}

@media screen and (min-width: 768px) {
  .tableLayout {
    height: 60vh;
  }
}

.tableLayout {
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
