// Database Module - CONTINUAÇÃO
import { db } from './firebase-init.js';
import {
  ref,
  get,
  set,
  update,
  remove,
  query,
  orderByChild,
  limitToLast,
  onValue,
  off,
  push,
  child,
  getDatabase
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { generateId, formatCurrency } from './utils.js';

/**
 * Carrega cardápio (menu.json)
 */
export async function loadMenu() {
  try {
    const response = await fetch('config/menu.json');
    const data = await response.json();

    let items = [];
    data.categorias.forEach(cat => {
      items = items.concat(cat.itens.map(item => ({
        ...item,
        categoria: cat.nome,
        id: item.id || item.nome.toLowerCase().replace(/\s+/g, '-')
      })));
    });

    console.log('✅ Menu carregado:', items.length, 'itens');
    return items;
  } catch (error) {
    console.error('Erro ao carregar menu:', error);
    return [];
  }
}

/**
 * Carrega insumos do Firebase
 */
export async function loadInsumos() {
  try {
    const insumosRef = ref(db, 'insumos');
    const snapshot = await get(insumosRef);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhum insumo encontrado');
      return [];
    }

    const insumos = [];
    snapshot.forEach(child => {
      insumos.push({
        nome: child.key,
        quantidade: child.val().quantidade || 0,
        unidade: child.val().unidade || 'unidade',
        dataCadastro: child.val().dataCadastro,
        ultimaAtualizacao: child.val().ultimaAtualizacao,
        historico: child.val().historico || [],
        nivel_minimo: child.val().nivel_minimo || 100
      });
    });

    console.log('✅ Insumos carregados:', insumos.length);
    return insumos;
  } catch (error) {
    console.error('Erro ao carregar insumos:', error);
    return [];
  }
}

/**
 * Adiciona insumo
 */
export async function addInsumo(nome, quantidade, unidade) {
  try {
    if (!nome || !quantidade || !unidade) {
      throw new Error('Campos obrigatórios faltando');
    }

    const insumoRef = ref(db, `insumos/${nome}`);
    const now = new Date().toISOString();

    await set(insumoRef, {
      quantidade: parseFloat(quantidade),
      unidade,
      dataCadastro: now,
      ultimaAtualizacao: now,
      historico: [{
        qtd: parseFloat(quantidade),
        timestamp: now,
        acao: 'Criado'
      }],
      nivel_minimo: 100
    });

    console.log('✅ Insumo adicionado:', nome);
    return true;
  } catch (error) {
    console.error('Erro ao adicionar insumo:', error);
    throw error;
  }
}

/**
 * Atualiza quantidade de insumo
 */
export async function updateInsumoQuantidade(nome, novaQuantidade) {
  try {
    const insumoRef = ref(db, `insumos/${nome}`);
    const snapshot = await get(insumoRef);

    if (!snapshot.exists()) {
      throw new Error('Insumo não encontrado');
    }

    const insumo = snapshot.val();
    const historico = insumo.historico || [];

    historico.push({
      qtd: novaQuantidade,
      timestamp: new Date().toISOString(),
      acao: 'Atualização manual'
    });

    await update(insumoRef, {
      quantidade: parseFloat(novaQuantidade),
      ultimaAtualizacao: new Date().toISOString(),
      historico
    });

    console.log('✅ Quantidade atualizada:', nome);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar insumo:', error);
    throw error;
  }
}

/**
 * Deleta insumo
 */
export async function deleteInsumo(nome) {
  try {
    const insumoRef = ref(db, `insumos/${nome}`);
    await remove(insumoRef);

    console.log('✅ Insumo deletado:', nome);
    return true;
  } catch (error) {
    console.error('Erro ao deletar insumo:', error);
    throw error;
  }
}

/**
 * Submete um novo pedido
 */
export async function submitOrder(clienteInfo, attendantId, cart) {
  try {
    if (!clienteInfo || cart.length === 0) {
      throw new Error('Dados incompletos');
    }

    const orderId = generateId();
    const now = new Date();
    const total = cart.reduce((sum, item) => sum + (item.preco * item.qty), 0);

    const order = {
      id: orderId,
      clienteInfo: clienteInfo.trim(),
      atendente: attendantId,
      items: cart.map(item => ({
        id: item.id,
        name: item.nome,
        price: item.preco,
        quantity: item.qty
      })),
      total,
      status: 'pending',
      createdAt: now.toISOString(),
      timestamp: now.getTime(),
      date: now.toISOString().split('T')[0],
      month: now.toISOString().substr(0, 7),
      cancelado: false
    };

    // Salva pedido
    const orderRef = ref(db, `orders/${orderId}`);
    await set(orderRef, order);

    // Atualiza vendas por mês (para relatório)
    const monthKey = order.month;
    const salesByMonthRef = ref(db, `salesByMonth/${monthKey}`);

    for (const item of cart) {
      const existingRef = await get(child(ref(db), `salesByMonth/${monthKey}/${item.nome}`));
      let currentData = existingRef.exists() ? existingRef.val() : { qty: 0, total: 0 };

      await set(child(ref(db), `salesByMonth/${monthKey}/${item.nome}`), {
        qty: (currentData.qty || 0) + item.qty,
        total: (currentData.total || 0) + (item.preco * item.qty),
        price: item.preco,
        lastSale: now.toISOString()
      }).catch(() => {}); // Ignora erros se nó não existir
    }

    // Registra em auditoria
    await logAudit('pedido', 'atendente', attendantId, 'create', 'orders', orderId, {
      client: clienteInfo,
      items: cart.length,
      total
    });

    console.log('✅ Pedido criado:', orderId);
    return orderId;
  } catch (error) {
    console.error('Erro ao submeter pedido:', error);
    throw error;
  }
}

/**
 * Listener para fila de cozinha (REAL-TIME)
 */
export function listenToKitchenQueue(callback) {
  try {
    const ordersRef = ref(db, 'orders');

    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const orders = [];
        snapshot.forEach((child) => {
          const order = child.val();

          // Filtra: não cancelado E (pendente OU pronto)
          if (!order.cancelado && (order.status === 'pending' || order.status === 'ready')) {
            orders.push({
              id: child.key,
              ...order
            });
          }
        });

        // Ordena: pending primeiro, depois por timestamp
        orders.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return (b.timestamp || 0) - (a.timestamp || 0);
        });

        console.log('📡 Fila atualizada:', orders.length, 'pedidos');
        callback(orders);
      },
      (error) => {
        console.error('❌ Erro ao carregar fila:', error);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error('Erro ao configurar listener:', error);
    return () => {};
  }
}

/**
 * Atualiza status do pedido
 */
export async function updateOrderStatus(orderId, newStatus) {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (!snapshot.exists()) {
      throw new Error('Pedido não encontrado');
    }

    const order = snapshot.val();
    const updates = { status: newStatus };

    // Se marcou como PRONTO: desconta estoque
    if (newStatus === 'ready' && order.status === 'pending') {
      await descontarEstoque(order.items);
      updates.startedAt = new Date().toISOString();
      updates.preparadoPor = 'Cozinha';

      await logAudit('estoque_descontado', 'cozinha', 'Sistema', 'update', 'orders', orderId, {
        items: order.items.length,
        total: order.total
      });
    }

    // Se marcou como ENTREGUE
    if (newStatus === 'done') {
      updates.completedAt = new Date().toISOString();

      await logAudit('pedido_entregue', 'cozinha', 'Sistema', 'update', 'orders', orderId, {
        tempoTotal: new Date() - new Date(order.createdAt)
      });
    }

    await update(orderRef, updates);
    console.log('✅ Status atualizado:', orderId, '→', newStatus);
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

/**
 * Desconta estoque (chamado quando marcado como pronto)
 */
async function descontarEstoque(items) {
  try {
    const composicoes = await loadCompositions();
    const insumos = await loadInsumos();

    for (const item of items) {
      // Encontra composição do item
      const comp = composicoes.find(c => c.itemName === item.name);

      if (!comp || !comp.composição) {
        console.warn('⚠️ Composição não encontrada:', item.name);
        continue;
      }

      // Desconta cada insumo
      for (const [insumoNome, qtdPorItem] of Object.entries(comp.composição)) {
        const totalQtyDescontar = qtdPorItem * item.quantity;

        const insumoRef = ref(db, `insumos/${insumoNome}`);
        const snapshot = await get(insumoRef);

        if (snapshot.exists()) {
          const insumo = snapshot.val();
          const novaQty = Math.max(0, (insumo.quantidade || 0) - totalQtyDescontar);

          const historico = insumo.historico || [];
          historico.push({
            qtd: -totalQtyDescontar,
            timestamp: new Date().toISOString(),
            acao: `Desconto: ${item.name} (${item.quantity}x)`
          });

          await update(insumoRef, {
            quantidade: novaQty,
            ultimaAtualizacao: new Date().toISOString(),
            historico
          });

          console.log(`✅ Estoque descontado: ${insumoNome} (-${totalQtyDescontar})`);
        } else {
          console.warn('⚠️ Insumo não encontrado:', insumoNome);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao descontar estoque:', error);
    throw error;
  }
}

/**
 * Cancela pedido
 */
export async function cancelOrder(orderId) {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (!snapshot.exists()) {
      throw new Error('Pedido não encontrado');
    }

    const order = snapshot.val();

    await update(orderRef, {
      cancelado: true,
      canceladoEm: new Date().toISOString(),
      status: 'cancelled'
    });

    // Audit log
    await logAudit('pedido_cancelado', 'cozinha', 'Sistema', 'update', 'orders', orderId, {
      motivo: 'Cancelado pela cozinha',
      cliente: order.clienteInfo
    });

    console.log('✅ Pedido cancelado:', orderId);
    return true;
  } catch (error) {
    console.error('Erro ao cancelar:', error);
    throw error;
  }
}

/**
 * Carrega relatório de um mês
 */
export async function loadReport(month) {
  try {
    if (!month) {
      throw new Error('Mês obrigatório');
    }

    const ordersRef = ref(db, 'orders');
    const snapshot = await get(ordersRef);

    let orders = [];
    if (snapshot.exists()) {
      snapshot.forEach(child => {
        const order = child.val();
        // Inclui pedidos do mês (não cancelados ou todos)
        if (order.month === month) {
          orders.push({
            id: child.key,
            ...order
          });
        }
      });
    }

    // Carrega vendas by month
    const salesRef = ref(db, `salesByMonth/${month}`);
    const salesSnapshot = await get(salesRef);
    let salesByMonth = {};

    if (salesSnapshot.exists()) {
      salesByMonth = salesSnapshot.val();
    }

    console.log('✅ Relatório carregado:', month, '-', orders.length, 'pedidos');

    return {
      month,
      orders,
      salesByMonth
    };
  } catch (error) {
    console.error('Erro ao carregar relatório:', error);
    throw error;
  }
}

/**
 * Deleta pedido (soft delete + restaura estoque)
 */
export async function deleteOrder(orderId) {
  try {
    const orderRef = ref(db, `orders/${orderId}`);
    const snapshot = await get(orderRef);

    if (!snapshot.exists()) {
      throw new Error('Pedido não encontrado');
    }

    const order = snapshot.val();

    // Se foi marcado como pronto, restaura estoque
    if (order.status === 'ready') {
      await restaurarEstoque(order.items);
    }

    // Soft delete
    await update(orderRef, {
      cancelado: true,
      deletadoEm: new Date().toISOString(),
      status: 'deleted'
    });

    // Audit log
    await logAudit('pedido_deletado', 'admin', 'Admin', 'delete', 'orders', orderId, {
      motivo: 'Deletado por administrador',
      cliente: order.clienteInfo,
      estoqueRestaurado: order.status === 'ready'
    });

    console.log('✅ Pedido deletado:', orderId);
    return true;
  } catch (error) {
    console.error('Erro ao deletar:', error);
    throw error;
  }
}

/**
 * Restaura estoque (quando pedido pronto é deletado)
 */
async function restaurarEstoque(items) {
  try {
    const composicoes = await loadCompositions();

    for (const item of items) {
      const comp = composicoes.find(c => c.itemName === item.name);
      if (!comp || !comp.composição) continue;

      for (const [insumoNome, qtdPorItem] of Object.entries(comp.composição)) {
        const totalQtyRestaurar = qtdPorItem * item.quantity;

        const insumoRef = ref(db, `insumos/${insumoNome}`);
        const snapshot = await get(insumoRef);

        if (snapshot.exists()) {
          const insumo = snapshot.val();
          const historico = insumo.historico || [];

          historico.push({
            qtd: totalQtyRestaurar,
            timestamp: new Date().toISOString(),
            acao: `Restauração: ${item.name} (${item.quantity}x)`
          });

          await update(insumoRef, {
            quantidade: (insumo.quantidade || 0) + totalQtyRestaurar,
            ultimaAtualizacao: new Date().toISOString(),
            historico
          });

          console.log(`✅ Estoque restaurado: ${insumoNome} (+${totalQtyRestaurar})`);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao restaurar estoque:', error);
  }
}

/**
 * Carrega composições
 */
export async function loadCompositions() {
  try {
    const compsRef = ref(db, 'composicoes');
    const snapshot = await get(compsRef);

    if (!snapshot.exists()) {
      console.log('ℹ️ Nenhuma composição encontrada');
      return [];
    }

    const compositions = [];
    snapshot.forEach(child => {
      compositions.push({
        itemId: child.key,
        itemName: child.key,
        composição: child.val(),
        dataCriacao: child.val().dataCriacao || new Date().toISOString()
      });
    });

    console.log('✅ Composições carregadas:', compositions.length);
    return compositions;
  } catch (error) {
    console.error('Erro ao carregar composições:', error);
    return [];
  }
}

/**
 * Salva composição de item
 */
export async function saveComposition(itemId, itemName, composição) {
  try {
    if (!itemName || Object.keys(composição).length === 0) {
      throw new Error('Dados inválidos');
    }

    const compRef = ref(db, `composicoes/${itemName}`);

    const dataToSave = {
      ...composição,
      dataCriacao: new Date().toISOString()
    };

    await set(compRef, dataToSave);

    console.log('✅ Composição salva:', itemName);
    return true;
  } catch (error) {
    console.error('Erro ao salvar composição:', error);
    throw error;
  }
}

/**
 * Deleta composição
 */
export async function deleteComposition(itemName) {
  try {
    const compRef = ref(db, `composicoes/${itemName}`);
    await remove(compRef);

    console.log('✅ Composição deletada:', itemName);
    return true;
  } catch (error) {
    console.error('Erro ao deletar composição:', error);
    throw error;
  }
}

/**
 * Verifica disponibilidade de itens
 */
export async function checkAvailability(menu, insumos, compositions) {
  try {
    const availability = menu.map(item => {
      const comp = compositions.find(c => c.itemName === item.nome);

      if (!comp || !comp.composição) {
        return {
          name: item.nome,
          canMake: 0,
          status: 'sem_composicao',
          missing: 'Sem composição definida'
        };
      }

      // Calcula quantos podem ser feitos
      let canMake = Infinity;
      let missingInsumo = null;

      for (const [insumoNome, qtdNeeded] of Object.entries(comp.composição)) {
        const insumo = insumos.find(i => i.nome === insumoNome);

        if (!insumo) {
          return {
            name: item.nome,
            canMake: 0,
            status: 'insumo_faltando',
            missing: `${insumoNome} não encontrado`
          };
        }

        const possible = Math.floor(insumo.quantidade / qtdNeeded);

        if (possible < canMake) {
          canMake = possible;
          if (possible === 0) {
            missingInsumo = `${insumoNome}: precisa ${qtdNeeded}, tem ${insumo.quantidade}`;
          }
        }
      }

      const status = canMake > 0 ? 'disponivel' : 'indisponivel';

      return {
        name: item.nome,
        canMake: canMake === Infinity ? 0 : canMake,
        status,
        missing: missingInsumo
      };
    });

    console.log('✅ Disponibilidade verificada:', availability.length);
    return availability;
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return [];
  }
}

/**
 * Registra auditoria
 */
async function logAudit(acao, role, usuario, tipo, recurso, recursoId, detalhes = {}) {
  try {
    const logId = generateId();
    const logRef = ref(db, `auditLog/${logId}`);

    await set(logRef, {
      timestamp: new Date().toISOString(),
      usuario,
      role,
      acao,
      recurso,
      recursoId,
      detalhes,
      resultadoStatus: 'sucesso',
      ipAddress: 'web-app'
    });

    console.log('📝 Auditoria registrada:', acao);
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não throw - auditoria não deve bloquear operações
  }
}

/**
 * Listener para atualizar dados em tempo real
 */
export function listenToAtendente(attendantId, callback) {
  try {
    const attendanteRef = ref(db, `atendentes/${attendantId}`);

    return onValue(attendanteRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val());
      }
    }, (error) => {
      console.error('Erro ao carregar atendente:', error);
    });
  } catch (error) {
    console.error('Erro ao configurar listener de atendente:', error);
    return () => {};
  }
}

/**
 * Registra novo atendente
 */
export async function registerAttendante(nome, email) {
  try {
    const id = `ATD-${generateId().substring(0, 9).toUpperCase()}`;
    const attendanteRef = ref(db, `atendentes/${id}`);

    await set(attendanteRef, {
      id,
      nome: nome.trim(),
      email: email ? email.trim() : '',
      ativo: true,
      dataCadastro: new Date().toISOString(),
      pedidosTotal: 0,
      vendidos: 0,
      ultimoAcesso: new Date().toISOString()
    });

    console.log('✅ Atendente registrado:', id);
    return id;
  } catch (error) {
    console.error('Erro ao registrar atendente:', error);
    throw error;
  }
}

/**
 * Carrega atendentes
 */
export async function loadAtendentes() {
  try {
    const attendantesRef = ref(db, 'atendentes');
    const snapshot = await get(attendantesRef);

    if (!snapshot.exists()) {
      return [];
    }

    const attendantes = [];
    snapshot.forEach(child => {
      attendantes.push({
        id: child.key,
        ...child.val()
      });
    });

    console.log('✅ Atendentes carregados:', attendantes.length);
    return attendantes;
  } catch (error) {
    console.error('Erro ao carregar atendentes:', error);
    return [];
  }
}

console.log('✅ DB module loaded completely');