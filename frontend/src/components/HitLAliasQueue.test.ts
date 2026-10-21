import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import HitLAliasQueue, { type HitLProposal, type AvailableEntity } from './HitLAliasQueue.vue';

const mockProposals: HitLProposal[] = [
  {
    proposalId: 'prop-1',
    candidateName: 'Young Ye',
    targetEntityId: 'ent-ye-chen',
    targetCanonicalName: 'Ye Chen',
    confidenceScore: 0.78,
    isCanon: false,
    status: 'PENDING',
    domain: 'jianghu',
    context: 'El joven Young Ye empuñó la espada celestial.',
    createdAt: '2026-10-21T10:00:00Z',
  },
  {
    proposalId: 'prop-2',
    candidateName: 'Sword Sect',
    targetEntityId: 'ent-sect-1',
    targetCanonicalName: 'Heavenly Sword Sect',
    confidenceScore: 0.92,
    isCanon: false,
    status: 'PENDING',
    domain: 'sects',
    createdAt: '2026-10-21T11:00:00Z',
  },
];

const mockEntities: AvailableEntity[] = [
  { entityId: 'ent-ye-chen', canonicalName: 'Ye Chen', domain: 'jianghu' },
  { entityId: 'ent-sect-1', canonicalName: 'Heavenly Sword Sect', domain: 'sects' },
  { entityId: 'ent-han-li', canonicalName: 'Han Li', domain: 'jianghu' },
];

describe('HitLAliasQueue.vue', () => {
  it('debe renderizar correctamente los candidatos de alias con sus datos y badges', () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    expect(wrapper.text()).toContain('Cola de Aprobación HitL (Human-in-the-Loop)');
    expect(wrapper.text()).toContain('"Young Ye"');
    expect(wrapper.text()).toContain('Ye Chen');
    expect(wrapper.text()).toContain('"Sword Sect"');
    expect(wrapper.text()).toContain('78.0%');
    expect(wrapper.text()).toContain('92.0%');
  });

  it('debe filtrar candidatos por afinidad/certeza mínima', async () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    const rangeInput = wrapper.find('input[type="range"]');
    await rangeInput.setValue(0.85);

    expect(wrapper.text()).not.toContain('"Young Ye"');
    expect(wrapper.text()).toContain('"Sword Sect"');
  });

  it('debe filtrar candidatos por dominio', async () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    const selects = wrapper.findAll('select');
    const domainSelect = selects[0];
    await domainSelect.setValue('sects');

    expect(wrapper.text()).not.toContain('"Young Ye"');
    expect(wrapper.text()).toContain('"Sword Sect"');
  });

  it('debe permitir aprobar un alias emitiendo evento y actualizando is_canon=true', async () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    const approveButtons = wrapper.findAll('button').filter((b) => b.text().includes('Aprobar (is_canon=1)'));
    expect(approveButtons.length).toBe(2);

    await approveButtons[0].trigger('click');

    const emitted = wrapper.emitted('approve');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toMatchObject({
      proposalId: 'prop-1',
      status: 'APPROVED',
      isCanon: true,
    });
  });

  it('debe permitir rechazar un alias emitiendo evento', async () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    const rejectButtons = wrapper.findAll('button').filter((b) => b.text().includes('Rechazar'));
    expect(rejectButtons.length).toBe(2);

    await rejectButtons[0].trigger('click');

    const emitted = wrapper.emitted('reject');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toMatchObject({
      proposalId: 'prop-1',
      status: 'REJECTED',
    });
  });

  it('debe abrir modal de unificar y emitir evento con entidad seleccionada', async () => {
    const wrapper = mount(HitLAliasQueue, {
      props: {
        initialProposals: mockProposals,
        availableEntities: mockEntities,
      },
    });

    const unifyButtons = wrapper.findAll('button').filter((b) => b.text().includes('Unificar entidad'));
    expect(unifyButtons.length).toBe(2);
    await unifyButtons[0].trigger('click');

    expect(wrapper.text()).toContain('Unificar Entidad Canónica');

    // Cambiar la entidad destino a Han Li en el modal
    const modalSelect = wrapper.find('.fixed select');
    await modalSelect.setValue('ent-han-li');

    const confirmButton = wrapper.findAll('.fixed button').find((b) => b.text().includes('Confirmar Unificación'));
    expect(confirmButton).toBeDefined();
    await confirmButton!.trigger('click');

    const emitted = wrapper.emitted('unify');
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toMatchObject({
      targetEntityId: 'ent-han-li',
      targetCanonicalName: 'Han Li',
      proposal: expect.objectContaining({
        proposalId: 'prop-1',
        targetEntityId: 'ent-han-li',
        targetCanonicalName: 'Han Li',
        status: 'APPROVED',
        isCanon: true,
      }),
    });
  });
});
