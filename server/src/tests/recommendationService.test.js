// tests for recommendationService
const { recalculateRecommendations, generateRecommendations } = require('../../services/recommendationService.js');
const Recommendation = require('../../models/recommendationModel.js');
const User = require('../../models/userModel.js');
const Program = require('../../models/universityModel.js');

jest.mock('../../models/recommendationModel.js');
jest.mock('../../models/userModel.js');
jest.mock('../../models/universityModel.js');

describe('recalculateRecommendations', () => {
  it('refreshes cached recommendations for all users of a program', async () => {
    const programId = 'testProgramId';

    // Mock users returned by User.find
    const mockUsers = [{ _id: 'u1' }, { _id: 'u2' }];
    User.find.mockResolvedValue(mockUsers);

    // Mock existing cached Recommendation docs
    const mockDocs = [
      { userId: 'u1', programId, recommendations: [], save: jest.fn().mockResolvedValue() },
      { userId: 'u2', programId, recommendations: [], save: jest.fn().mockResolvedValue() },
    ];
    Recommendation.find.mockResolvedValue(mockDocs);

    // Mock generateRecommendations to return dummy recommendations
    const dummyRecs = [{ programId, recommendation: [{ programId, score: 1 }] }];
    jest.spyOn(require('../../services/recommendationService.js'), 'generateRecommendations').mockResolvedValue(dummyRecs);

    await recalculateRecommendations(programId);

    // Ensure each cached doc was saved with new recommendations
    mockDocs.forEach(doc => {
      expect(doc.save).toHaveBeenCalled();
      expect(doc.recommendations).toEqual(dummyRecs);
    });
  });
});
