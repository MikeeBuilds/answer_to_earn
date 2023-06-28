const { expect } = require('chai')
const { ethers } = require('hardhat')
const { expectRevert } = require('@openzeppelin/test-helpers')

const toWei = (num) => ethers.utils.parseEther(num.toString())
const fromWei = (num) => ethers.utils.formatEther(num)

describe('Contracts', () => {
  const serviceFee = 5
  const id = 1
  const title = 'How to convert a string to lowercase in Python?'
  const description = `I have a string variable in Python, and I want to convert
    it to lowercase. What is the best way to achieve this?
    Are there any built-in functions or methods available for this task?`
  const tags = 'python, string, lowercase'
  const prize = 0.1

  let contract, result
  beforeEach(async () => {
    const Contract = await ethers.getContractFactory('AnswerToEarn')
    ;[owner, commentor1, commentor2] = await ethers.getSigners()

    contract = await Contract.deploy(serviceFee)
    await contract.deployed()
  })

  describe('Question Management', () => {
    beforeEach(async () => {
      await contract.createQuestion(title, description, tags, {
        value: toWei(prize),
      })
    })

    it('Should verify that questions can be created successfully', async () => {
      result = await contract.getQuestions()
      expect(result).to.have.lengthOf(1)

      result = await contract.getQuestion(id)
      expect(result.title).to.be.equal(title)
      expect(result.description).to.be.equal(description)
      expect(result.tags).to.be.equal(tags)
      expect(fromWei(result.prize)).to.be.equal(prize.toString())

      await expectRevert(contract.createQuestion(title, description, tags), 'Insufficient amount')
    })

    it('Should verify update of title, description, and tags', async () => {
      const updatedTitle = 'This title has been updated'
      await contract.updateQuestion(id, updatedTitle, description, tags)

      result = await contract.getQuestion(id)
      expect(result.title).to.be.equal(updatedTitle)

      await expectRevert(
        contract.connect(commentor1).updateQuestion(id, updatedTitle, description, tags),
        'Unauthorized entity!'
      )

      await expectRevert(
        contract.connect(commentor1).updateQuestion(100, updatedTitle, description, tags),
        'Question not found'
      )
    })
  })
})
