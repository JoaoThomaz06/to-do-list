<script setup>
import logo from "@/assets/koop.png";
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from 'axios';
import { useAuth } from "./stores/auth";

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoggedIn = ref(false);
const listaTarefas = ref([]);
const taskInput = ref(null);
const searchQuery = ref("");
const selecionarAtivo = ref(false);
const confirmDelete = ref(false);
const tarefaEditando = ref(null)
const filteredTarefas = computed(() => {
  return listaTarefas.value.filter(tarefa =>
    tarefa.nome.toLowerCase().includes(searchQuery.value.toLowerCase())
  );

})

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1/',
  headers: {
    'Content-type': 'application/json'
  }
})


async function handleLogin() {
  console.log('passei')
  const user = { username: username.value, password: password.value }
  try {
    const auth = useAuth();
    const response = await api.post('token/', user);
    auth.setToken(response.data.access);
    console.log('token armazenado', auth.token)
    isLoggedIn.value = true;
    errorMessage.value = '';
    listaTarefas.value = await buscarTarefa();
    return response

  } catch (error) {
    errorMessage.value = 'Credenciais inválidas!';
    console.error(error);
  }

}


async function buscarTarefa() {
  try {
    const authStore = useAuth();
    const response = await api.get('tarefa/',
      {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
      });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar os dados:', error);
    throw error;
  }
}


async function criarTarefa(data) {
  try {
    const authStore = useAuth();
    const response = await api.post('tarefa/', data,
      {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        },
      });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar os dados:', error);
    throw error;
  }
}


async function atualizarTarefa(id, data) {
  try {
    const authStore = useAuth();
    const response = await api.put(`tarefa/${id}/`, data, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar os dados:', error);
    throw error;
  }
}


async function deleteTarefa(id) {
  try {
    const authStore = useAuth();
    const response = await api.delete(`tarefa/${id}/`, {
      headers: {
        'Authorization': `Bearer ${authStore.token}`
      },
    });
    return response;
  } catch (error) {
    console.error('Erro ao deletar os dados:', error);
    throw error;
  }
}


async function submitUpdateData(id) {
  if (!id) {
    console.error('Nenhuma tarefa selecionada para editar.');
    return;
  }

  const tarefaEditada = listaTarefas.value.find(tarefa => tarefa.id === id);
  const tarefaData = {
    "status": tarefaEditada.status,
    "nome": tarefaEditada.nome,
    "usuario": "1"
  }
  try {
    const response = await atualizarTarefa(id, tarefaData);
    console.log('Resposta da API após atualização:', response.data);

    listaTarefas.value = await buscarTarefa();
  } catch (error) {
    console.error('Erro ao atualizar os dados:', error);
  }
}


async function submitData() {
  try {
    const tarefaData = {
      "status": false,
      "nome": taskInput.value,
      "usuario": "1"
    }
    console.log('Dados a serem enviados:', tarefaData);
    const response = await criarTarefa(tarefaData);
    console.log('Resposta da API:', response.data);
    listaTarefas.value = await buscarTarefa();
    taskInput.value = '';
  } catch (error) {
    console.error('Erro ao enviar os dados:', error);
  }

}


async function toggleTarefa(tarefa,) {
  tarefa.status = !tarefa.status;
  const tarefaData = {
    status: tarefa.status,
    nome: tarefa.nome,
    usuario: "1"
  };
  try {
    await atualizarTarefa(tarefa.id, tarefaData);
    console.log(`Tarefa ${tarefa.id} atualizada com sucesso.`);
  } catch (error) {
    console.error('Erro ao atualizar a tarefa:', error);
    tarefa.status = !tarefa.status;
  }
}


function handleSelection(tarefa) {
  if (selecionarAtivo.value) {
    tarefa.selecionada = !tarefa.selecionada;
  } else {
    tarefaEditando.value = tarefa;
    taskInput.value = tarefa.nome;
  }
}


function toggleSelecionar() {
  selecionarAtivo.value = !selecionarAtivo.value;

  if (!selecionarAtivo.value) {
    listaTarefas.value.forEach(tarefa => {
      tarefa.selecionada = false;
    });
  }
}


function deleteSelected() {
  listaTarefas.value = listaTarefas.value.filter(tarefa => !tarefa.selecionada);
  confirmDelete.value = false;
}


async function handleConfirmDelete() {

  const deletePromises = listaTarefas.value
    .filter(tarefa => tarefa.selecionada)
    .map(tarefa => deleteTarefa(tarefa.id));

  await Promise.all(deletePromises);

  listaTarefas.value = await buscarTarefa();
  taskInput.value = '';
}


function handleKeydown(event) {
  if (event.key === "Delete") {
    deleteSelected();
  }
}


function handleLogout() {
  const auth = useAuth();
  auth.clear();
  window.location.reload();
}


onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  const auth = useAuth();
  if (auth.token) {
    isLoggedIn.value = true;
    try {
      listaTarefas.value = await buscarTarefa();
    } catch (error) {
      console.error('Erro ao carregar as tarefas:', error);
    }
  }
});


onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});


</script>

<style scoped>
.note-container {
  border: 1px solid transparent;
  border-radius: 10px;
  transition: border 0.1s;
}

.note-container.selected {
  border: 1px solid rgba(102, 153, 255, 0.493);
  /* Cor da borda azul quando selecionada */
  background-color: rgba(102, 153, 255);
  /* Fundo azul claro */
}

.form-check-input {
  transform: scale(1.5);
  margin-top: 10px;
}

.background-image {
  background-image: url('@/assets/background.svg');
}

.cursor-pointer {
  cursor: pointer;
}

.background-image {
  background-image: url('@/assets/background.svg');
}

.centered-form {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>

<template>

  <div class="w-100 vh-100 background-image z-3 position-absolute p-5 rounded-3">
    <div class="row justify-content-center" data-bs-theme="dark">
      <div class="col-8">
        <div class="card text-bg-dark text-center">
          <div class="card-header">
            <a class="navbar-brand">
              <img :src="logo" alt="Logo" style="width: 300px; height:auto;">
            </a>
          </div>
          <div v-if="!isLoggedIn" class="card-body">
            <h1>Login</h1>
            <form @submit.prevent="handleLogin" class="centered-form">
              <div class="mb-2">
                <label for="username" class="form-label">Usuário</label>
                <input type="text" id="username" class="form-control" v-model="username" required />
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Senha</label>
                <input type="password" id="password" class="form-control mx-auto" v-model="password" required />
              </div>
              <button type="submit" class="btn btn-primary">Logar</button>
              <div v-if="errorMessage" class="text-warning mt-2">{{ errorMessage }}</div>
            </form>
          </div>
          <div v-else>
            <div class="card-body">
              <form class="d-flex" role="search">
                <input class="form-control mx-auto w-50 border border-warning-subtle mb-3" type="search"
                  placeholder="Pesquisar" aria-label="Search" v-model="searchQuery">
              </form>
              <hr class="hr m-1">
              <div class="input-group mt-3 mx-auto w-50">
                <input type="text" class="form-control text-center border border-warning-subtle"
                  placeholder="Adicione uma nota" v-model="taskInput"
                  @keydown.enter="tarefaEditando ? submitUpdateData() : submitData()" aria-label="Recipient's username"
                  aria-describedby="button-addon2">
                <button @click="tarefaEditando ? submitUpdateData() : submitData()" class="btn btn-outline-warning"
                  type="button" id="button-addon2">{{ tarefaEditando ? 'Atualizar' : 'Criar' }}</button>
              </div>
            </div>
            <div class="card-body">
              <div class="overflow-y-scroll" style="max-height: 450px;">
                <div class="container text-center">
                  <div class="row">
                    <div class="col-md-6 offset-md-3">
                      <div v-for="tarefa in filteredTarefas" :key="tarefa.id"
                        :class="['my-2 py-2 note-container', { selected: tarefa.selecionada, 'cursor-pointer': selecionarAtivo }]"
                        @click.stop="selecionarAtivo ? handleSelection(tarefa) : null" style="user-select: none;">
                        <div class="d-flex justify-content-between px-3">
                          <div class="col-1">
                            <div class="form-check form-switch">
                              <input class="form-check-input border border-info-subtle" type="checkbox" role="switch"
                                :checked="tarefa.status" @change="toggleTarefa(tarefa)" @click.stop />
                            </div>
                          </div>
                          <div class="col-10">
                            <input type="text" class="form-control w-100" v-model="tarefa.nome"
                              :readonly="!tarefa.editando"
                              @keydown.enter="tarefa.editando = false; submitUpdateData(tarefa.id)" @click.stop />
                          </div>
                          <div class="col-1 text-end">
                            <button v-if="!tarefa.editando" @click.stop="tarefa.editando = true"
                              class="btn btn-warning btn-sm">
                              <i class="bi bi-pencil-square"></i>
                            </button>
                            <button v-else @click.stop="tarefa.editando = false; submitUpdateData(tarefa.id)"
                              class="btn btn-success btn-sm">
                              <i class="bi bi-patch-check"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="card-footer text-body-secondary">
              <div class="d-flex row justify-content-between">
                <div class="col-1"></div>
                <div class="btn-group w-50 col-6" role="group">
                  <button @click="toggleSelecionar" class="btn btn-primary w-100">
                    {{ selecionarAtivo ? 'Desativar Seleção' : 'Clique para selecionar' }}
                  </button>
                  <button v-if="selecionarAtivo" @click="confirmDelete = !confirmDelete" class="btn btn-danger w-100">
                    {{ confirmDelete ? 'Cancelar' : 'Excluir Selecionados' }}
                  </button>
                  <button v-if="confirmDelete" @click="handleConfirmDelete" class="btn btn-success w-100">
                    Confimar
                  </button>
                </div>
                <div class="col-1 p-0">
                  <button v-if="isLoggedIn" @click="handleLogout" class="btn btn-danger">
                    <i class="bi bi-power"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>
