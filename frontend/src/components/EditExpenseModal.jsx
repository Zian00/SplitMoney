import { useState, useEffect } from 'react';

const EditExpenseModal = ({
	isOpen,
	onClose,
	onUpdate,
	expense,
	setExpense,
	groupMembers,
	title,
	submitText,
}) => {
	const [splitMode, setSplitMode] = useState('equal');
	const [autoCalculateShares, setAutoCalculateShares] = useState(true);

	const calculateEqualShares = (totalAmount, memberCount) => {
		if (memberCount === 0) return [];
		const baseShare = totalAmount / memberCount;
		const shares = [];
		for (let i = 0; i < memberCount; i++) {
			shares.push(Math.floor(baseShare * 100) / 100);
		}
		const totalRounded = shares.reduce((sum, share) => sum + share, 0);
		const remainder = Math.round((totalAmount - totalRounded) * 100);
		for (let i = 0; i < remainder; i++) {
			shares[i] = Math.round((shares[i] + 0.01) * 100) / 100;
		}
		return shares;
	};

	const calculateSharesFromPayers = () => {
		if (!autoCalculateShares || splitMode === 'custom' || !expense) return;

		const totalAmount = parseFloat(expense.total_amount || 0);
		if (totalAmount <= 0) return;

		const validPayers = expense.payers.filter(
			(payer) => payer.user_id && payer.paid_amount
		);
		if (validPayers.length === 0) return;

		let newShares = [];

		if (splitMode === 'equal') {
			const equalShares = calculateEqualShares(
				totalAmount,
				groupMembers.length
			);
			newShares = groupMembers.map((member, index) => ({
				user_id: member.id.toString(),
				share_amount: equalShares[index].toFixed(2),
			}));
		} else if (splitMode === 'percentage') {
			const totalPaid = validPayers.reduce(
				(sum, payer) => sum + parseFloat(payer.paid_amount),
				0
			);
			if (totalPaid === 0) return;
			const proportionalShares = validPayers.map((payer) => {
				const percentage = parseFloat(payer.paid_amount) / totalPaid;
				const share = totalAmount * percentage;
				return Math.round(share * 100) / 100;
			});
			const totalCalculated = proportionalShares.reduce(
				(sum, share) => sum + share,
				0
			);
			const difference = totalAmount - totalCalculated;

			if (Math.abs(difference) > 0.001) {
				proportionalShares[0] =
					Math.round((proportionalShares[0] + difference) * 100) /
					100;
			}
			newShares = validPayers.map((payer, index) => ({
				user_id: payer.user_id,
				share_amount: proportionalShares[index].toFixed(2),
			}));
		}

		setExpense({
			...expense,
			shares: newShares,
		});
	};

	useEffect(() => {
		if (autoCalculateShares && isOpen) {
			calculateSharesFromPayers();
		}
	}, [
		expense?.payers,
		expense?.total_amount,
		splitMode,
		autoCalculateShares,
		isOpen,
	]);

	const calculateRemainingAmount = () => {
		if (!expense) {
			return {
				totalAmount: 0,
				totalPaid: 0,
				totalShares: 0,
				remainingPaid: 0,
				remainingShares: 0,
			};
		}
		const totalAmount = parseFloat(expense.total_amount || 0);
		const totalPaid = expense.payers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount || 0),
			0
		);
		const totalShares = expense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		return {
			totalAmount,
			totalPaid,
			totalShares,
			remainingPaid: totalAmount - totalPaid,
			remainingShares: totalAmount - totalShares,
		};
	};

	const autoBalanceShares = () => {
		if (!expense) return;
		const totalAmount = parseFloat(expense.total_amount || 0);
		const currentTotal = expense.shares.reduce(
			(sum, share) => sum + parseFloat(share.share_amount || 0),
			0
		);
		const remaining = totalAmount - currentTotal;
		if (remaining > 0) {
			const firstEmptyShare = expense.shares.find(
				(share) =>
					!share.share_amount || parseFloat(share.share_amount) === 0
			);
			if (firstEmptyShare) {
				const shareIndex = expense.shares.indexOf(firstEmptyShare);
				const updatedShares = [...expense.shares];
				updatedShares[shareIndex] = {
					...updatedShares[shareIndex],
					share_amount: remaining.toFixed(2),
				};
				setExpense({ ...expense, shares: updatedShares });
			}
		}
	};

	const getAvailableUsersForPayer = (currentIndex) => {
		if (!expense) return [];
		const selectedUserIds = expense.payers
			.map((payer, i) => (i !== currentIndex ? payer.user_id : null))
			.filter((id) => id && id !== '')
			.map((id) => String(id));
		return groupMembers.filter(
			(member) => !selectedUserIds.includes(String(member.id))
		);
	};

	const getAvailableUsersForShare = (currentIndex) => {
		if (!expense) return [];
		const selectedUserIds = expense.shares
			.map((share, i) => (i !== currentIndex ? share.user_id : null))
			.filter((id) => id && id !== '')
			.map((id) => String(id));
		return groupMembers.filter(
			(member) => !selectedUserIds.includes(String(member.id))
		);
	};

	if (!isOpen || !expense) return null;
	const { totalAmount, totalPaid, totalShares, remainingShares } =
		calculateRemainingAmount();

	return (
		<div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
			<div className='bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
				<h2 className='text-xl font-semibold mb-4'>{title}</h2>

				<form onSubmit={onUpdate}>
					<div className='space-y-6'>
						{/* Basic Info */}
						<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium mb-2'>
									Description
								</label>
								<input
									type='text'
									value={expense.description}
									onChange={(e) =>
										setExpense({
											...expense,
											description: e.target.value,
										})
									}
									className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
									placeholder='e.g., Dinner, Groceries'
								/>
							</div>

							<div>
								<label className='block text-sm font-medium mb-2'>
									Total Amount
								</label>
								<input
									type='number'
									step='0.01'
									value={expense.total_amount}
									onChange={(e) =>
										setExpense({
											...expense,
											total_amount: e.target.value,
										})
									}
									className='w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500'
									required
								/>
							</div>
						</div>

						{/* Split Mode Selection */}
						<div className='bg-gray-50 p-4 rounded'>
							<h3 className='font-medium mb-3'>Split Options</h3>
							<div className='flex items-center space-x-4 mb-3'>
								<label className='flex items-center'>
									<input
										type='checkbox'
										checked={autoCalculateShares}
										onChange={(e) =>
											setAutoCalculateShares(
												e.target.checked
											)
										}
										className='mr-2'
									/>
									Auto-calculate shares
								</label>
							</div>

							{autoCalculateShares && (
								<div className='flex space-x-4'>
									<label className='flex items-center'>
										<input
											type='radio'
											name='splitMode'
											value='equal'
											checked={splitMode === 'equal'}
											onChange={(e) =>
												setSplitMode(e.target.value)
											}
											className='mr-2'
										/>
										Equal split
									</label>
									<label className='flex items-center'>
										<input
											type='radio'
											name='splitMode'
											value='percentage'
											checked={splitMode === 'percentage'}
											onChange={(e) =>
												setSplitMode(e.target.value)
											}
											className='mr-2'
										/>
										Proportional to amount paid
									</label>
									<label className='flex items-center'>
										<input
											type='radio'
											name='splitMode'
											value='custom'
											checked={splitMode === 'custom'}
											onChange={(e) =>
												setSplitMode(e.target.value)
											}
											className='mr-2'
										/>
										Custom amounts
									</label>
								</div>
							)}
						</div>

						{/* Payers Section */}
						<div>
							<label className='block text-sm font-medium mb-2'>
								Who Paid (Payers)
							</label>
							{expense.payers.map((payer, index) => (
								<div
									key={index}
									className='flex space-x-2 mb-2'
								>
									<select
										value={payer.user_id}
										onChange={(e) =>
											setExpense({
												...expense,
												payers: expense.payers.map(
													(p, i) =>
														i === index
															? {
																	...p,
																	user_id:
																		e.target
																			.value,
															  }
															: p
												),
											})
										}
										className='flex-1 p-2 border border-gray-300 rounded'
										required
									>
										<option value=''>Select User</option>
										{getAvailableUsersForPayer(index).map(
											(member) => (
												<option
													key={member.id}
													value={member.id}
												>
													{member.email}
												</option>
											)
										)}
									</select>
									<input
										type='number'
										step='0.01'
										placeholder='Amount paid'
										value={payer.paid_amount}
										onChange={(e) =>
											setExpense({
												...expense,
												payers: expense.payers.map(
													(p, i) =>
														i === index
															? {
																	...p,
																	paid_amount:
																		e.target
																			.value,
															  }
															: p
												),
											})
										}
										className='flex-1 p-2 border border-gray-300 rounded'
										required
									/>
									{expense.payers.length > 1 && (
										<button
											type='button'
											onClick={() =>
												setExpense({
													...expense,
													payers: expense.payers.filter(
														(_, i) => i !== index
													),
												})
											}
											className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
										>
											×
										</button>
									)}
								</div>
							))}
							<button
								type='button'
								onClick={() =>
									setExpense({
										...expense,
										payers: [
											...expense.payers,
											{
												user_id: '',
												paid_amount: '',
											},
										],
									})
								}
								className='text-blue-500 text-sm hover:text-blue-700'
							>
								+ Add another payer
							</button>
						</div>

						{/* Shares Section */}
						<div>
							<label className='block text-sm font-medium mb-2'>
								Who Owes (Shares){' '}
								{autoCalculateShares &&
									splitMode !== 'custom' &&
									'(Auto-calculated)'}
							</label>
							{expense.shares.map((share, index) => (
								<div
									key={index}
									className='flex space-x-2 mb-2'
								>
									<select
										value={share.user_id}
										onChange={(e) =>
											setExpense({
												...expense,
												shares: expense.shares.map(
													(s, i) =>
														i === index
															? {
																	...s,
																	user_id:
																		e.target
																			.value,
															  }
															: s
												),
											})
										}
										className='flex-1 p-2 border border-gray-300 rounded'
										required
										disabled={
											autoCalculateShares &&
											splitMode !== 'custom'
										}
									>
										<option value=''>Select User</option>
										{getAvailableUsersForShare(index).map(
											(member) => (
												<option
													key={member.id}
													value={member.id}
												>
													{member.email}
												</option>
											)
										)}
									</select>
									<input
										type='number'
										step='0.01'
										placeholder='Amount owed'
										value={share.share_amount}
										onChange={(e) =>
											setExpense({
												...expense,
												shares: expense.shares.map(
													(s, i) =>
														i === index
															? {
																	...s,
																	share_amount:
																		e.target
																			.value,
															  }
															: s
												),
											})
										}
										className='flex-1 p-2 border border-gray-300 rounded'
										required
										disabled={
											autoCalculateShares &&
											splitMode !== 'custom'
										}
									/>
									{expense.shares.length > 1 && (
										<button
											type='button'
											onClick={() =>
												setExpense({
													...expense,
													shares: expense.shares.filter(
														(_, i) => i !== index
													),
												})
											}
											className='px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600'
										>
											×
										</button>
									)}
								</div>
							))}

							{/* Smart add button */}
							{autoCalculateShares && splitMode !== 'custom' ? (
								<div className='text-sm text-gray-600'>
									💡 Switch to "Custom amounts" mode to
									manually add/remove people who owe
								</div>
							) : (
								<button
									type='button'
									onClick={() =>
										setExpense({
											...expense,
											shares: [
												...expense.shares,
												{
													user_id: '',
													share_amount: '',
												},
											],
										})
									}
									className='text-blue-500 text-sm hover:text-blue-700'
								>
									+ Add another person who owes
								</button>
							)}
						</div>

						{/* Enhanced Validation Summary */}
						<div className='bg-gray-50 p-4 rounded'>
							<h3 className='font-medium mb-3'>
								Validation Summary
							</h3>
							<div className='space-y-2 text-sm'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<span className='font-medium'>
											Total Amount:
										</span>{' '}
										${totalAmount.toFixed(2)}
									</div>
									<div>
										<span className='font-medium'>
											Total Paid:
										</span>
										<span
											className={
												Math.abs(
													totalPaid - totalAmount
												) < 0.01
													? 'text-green-600'
													: 'text-red-600'
											}
										>
											{' '}
											${totalPaid.toFixed(2)}
										</span>
									</div>
								</div>

								<div className='grid grid-cols-2 gap-4'>
									<div>
										<span className='font-medium'>
											Total Shares:
										</span>
										<span
											className={
												Math.abs(
													totalShares - totalAmount
												) < 0.01
													? 'text-green-600'
													: 'text-red-600'
											}
										>
											{' '}
											${totalShares.toFixed(2)}
										</span>
									</div>
									<div>
										<span className='font-medium'>
											Remaining:
										</span>
										<span
											className={
												Math.abs(remainingShares) < 0.01
													? 'text-green-600'
													: 'text-orange-600'
											}
										>
											{' '}
											${remainingShares.toFixed(2)}
										</span>
									</div>
								</div>

								{splitMode === 'equal' &&
									Math.abs(remainingShares) < 0.01 &&
									remainingShares !== 0 && (
										<div className='bg-blue-100 border border-blue-300 text-blue-700 px-3 py-2 rounded text-xs'>
											ℹ️ Precision difference of $
											{Math.abs(remainingShares).toFixed(
												2
											)}{' '}
											automatically distributed
										</div>
									)}

								{Math.abs(totalPaid - totalAmount) < 0.01 &&
									Math.abs(totalShares - totalAmount) <
										0.01 && (
										<div className='bg-green-100 border border-green-300 text-green-700 px-3 py-2 rounded'>
											✅ All amounts are balanced!
										</div>
									)}
							</div>
						</div>

						<div>
							<div className='text-sm text-gray-600 mb-2'>
								💡 Custom amounts must add up to the total
								expense amount (${totalAmount.toFixed(2)})
							</div>

							<div
								className={`text-sm ${
									totalShares > totalAmount
										? 'text-red-600'
										: 'text-green-600'
								}`}
							>
								Total shares: ${totalShares.toFixed(2)} / $
								{totalAmount.toFixed(2)}
							</div>

							{Math.abs(totalShares - totalAmount) > 0.01 && (
								<button
									type='button'
									onClick={autoBalanceShares}
									className='text-blue-500 text-sm hover:text-blue-700'
								>
									🔧 Auto-balance remaining amount
								</button>
							)}
						</div>
					</div>

					<div className='flex justify-end space-x-3 mt-6'>
						<button
							type='button'
							onClick={onClose}
							className='px-4 py-2 text-gray-600 hover:text-gray-800'
						>
							Cancel
						</button>
						<button
							type='submit'
							className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600'
							disabled={
								Math.abs(totalPaid - totalAmount) > 0.01 ||
								Math.abs(totalShares - totalAmount) > 0.01
							}
						>
							{submitText}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditExpenseModal;
