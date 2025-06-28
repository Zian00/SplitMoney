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
	readOnlyDescription = false,
	allowedPayerIds = null,
	allowedShareIds = null,
}) => {
	const [splitMode, setSplitMode] = useState('equal');
	const [selectedSplitMembers, setSelectedSplitMembers] = useState(
		groupMembers.map(m => m.id.toString())
	);
	
	// Add useEffect to handle body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}

		// Cleanup function to restore scroll when component unmounts
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && groupMembers) {
			setSelectedSplitMembers(groupMembers.map(m => m.id.toString()));
		}
	}, [isOpen, groupMembers]);

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

	const calculatePercentageShares = () => {
		const totalAmount = parseFloat(expense.total_amount || 0);
		const validPayers = expense.payers.filter(
			(payer) => payer.user_id && payer.paid_amount
		);
		const totalPaid = validPayers.reduce(
			(sum, payer) => sum + parseFloat(payer.paid_amount),
			0
		);
		if (totalPaid === 0) return [];
		const percentageShares = validPayers.map((payer) => {
			const percentage = parseFloat(payer.paid_amount) / totalPaid;
			const share = totalAmount * percentage;
			return Math.round(share * 100) / 100;
		});
		const totalCalculated = percentageShares.reduce(
			(sum, share) => sum + share,
			0
		);
		const difference = totalAmount - totalCalculated;
		if (Math.abs(difference) > 0.001) {
			percentageShares[0] =
				Math.round((percentageShares[0] + difference) * 100) / 100;
		}
		return validPayers.map((payer, index) => ({
			user_id: payer.user_id,
			share_amount: percentageShares[index].toFixed(2),
		}));
	};

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

	useEffect(() => {
		if (!isOpen || !expense) return;
		const totalAmount = parseFloat(expense.total_amount || 0);

		if (splitMode === 'equal') {
			const selectedMembers = groupMembers.filter(m => selectedSplitMembers.includes(m.id.toString()));
			if (selectedMembers.length === 0) return;
			const equalShares = calculateEqualShares(
				totalAmount,
				selectedMembers.length
			);
			setExpense({
				...expense,
				shares: selectedMembers.map((member, index) => ({
					user_id: member.id.toString(),
					share_amount: equalShares[index].toFixed(2),
				})),
			});
		} else if (splitMode === 'percentage') {
			const newShares = calculatePercentageShares();
			setExpense({
				...expense,
				shares: newShares,
			});
		}
		// Don't auto-calculate for custom
		// eslint-disable-next-line
	}, [splitMode, expense?.payers, expense?.total_amount, isOpen, selectedSplitMembers, groupMembers]);

	const handleShareChange = (index, value) => {
		setExpense({
			...expense,
			shares: expense.shares.map((s, i) =>
				i === index ? { ...s, share_amount: value } : s
			),
		});
		if (splitMode !== 'custom') setSplitMode('custom');
	};

	const { totalAmount, totalPaid, totalShares, remainingShares } =
		calculateRemainingAmount();

	const isBalanced =
		Math.abs(totalPaid - totalAmount) < 0.01 &&
		Math.abs(totalShares - totalAmount) < 0.01;

	if (!isOpen || !expense) return null;

	return (
		<div
			className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4"
			style={{
				background: 'hsla(220, 9%, 46%, 0.75)',
				backdropFilter: 'blur(4px)',
				WebkitBackdropFilter: 'blur(4px)',
			}}
		>
			<div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
				{/* Header */}
				<div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-100">
					<div className="flex items-center justify-between">
						<h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{title}</h2>
						<button
							type="button"
							onClick={onClose}
							className="text-gray-400 hover:text-gray-600 transition-colors p-1"
						>
							<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Scrollable Content */}
				<div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
					<form onSubmit={onUpdate} className="space-y-6">
						{/* Description & Amount */}
						<div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
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
									className='w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
									placeholder='e.g., Dinner, Groceries'
									disabled={readOnlyDescription}
								/>
							</div>
							<div>
								<label className='block text-sm font-medium text-gray-700 mb-2'>
									Total Amount ($)
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
									className='w-full p-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
									required
									placeholder="0.00"
								/>
							</div>
						</div>

						{/* Hide Split Type if settlement (only one allowed share) */}
						{!(allowedShareIds && allowedShareIds.length === 1) && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">Split Type</label>
								<div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
									<button
										type="button"
										className={`px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
											${splitMode === 'equal'
												? 'bg-white text-blue-600 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'}
										`}
										onClick={() => setSplitMode('equal')}
									>
										Equal
									</button>
									<button
										type="button"
										className={`px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
											${splitMode === 'percentage'
												? 'bg-white text-blue-600 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'}
										`}
										onClick={() => setSplitMode('percentage')}
									>
										Percentage
									</button>
									<button
										type="button"
										className={`px-3 py-2 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
											${splitMode === 'custom'
												? 'bg-white text-blue-600 shadow-sm'
												: 'text-gray-600 hover:text-gray-900'}
										`}
										onClick={() => setSplitMode('custom')}
									>
										Custom
									</button>
								</div>
							</div>
						)}

						{/* Who Paid Section */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold text-gray-900">Who Paid</h3>
							</div>
							<div className="space-y-3">
								{expense.payers.map((payer, index) => {
									// Exclude already selected users in other payer rows
									const selectedUserIds = expense.payers
										.map((p, i) => (i !== index ? p.user_id : null))
										.filter(Boolean);

									return (
										<div key={index} className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
											<div className="flex flex-col sm:flex-row gap-3">
												<div className="flex-1">
													<label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Person</label>
													<select
														value={payer.user_id}
														onChange={(e) =>
															setExpense({
																...expense,
																payers: expense.payers.map(
																	(p, i) =>
																		i === index
																			? { ...p, user_id: e.target.value }
																			: p
																),
															})
														}
														className='w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
														required
														disabled={allowedPayerIds && allowedPayerIds.length === 1}
													>
														<option value=''>Select Person</option>
														{groupMembers
															.filter(member =>
																!selectedUserIds.includes(member.id.toString()) &&
																(!allowedPayerIds || allowedPayerIds.includes(member.id))
															)
															.map(member => (
																<option key={member.id} value={member.id}>
																	{member.name || member.email}
																</option>
															))}
													</select>
												</div>
												<div className="flex-1">
													<label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Amount Paid</label>
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
																					paid_amount: e.target.value,
																			  }
																			: p
																),
															})
														}
														className='w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
														required
													/>
												</div>
												{expense.payers.length > 1 && (
													<div className="flex-shrink-0">
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
															className='w-full sm:w-auto px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium'
															title="Remove payer"
														>
															Remove
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})}
								{/* Only show + Add Another Payer if not restricted to a single payer (not a settlement) */}
								{(!allowedPayerIds || allowedPayerIds.length !== 1) && (
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
										className='w-full sm:w-auto bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-100 text-sm font-medium transition-colors'
									>
										+ Add Another Payer
									</button>
								)}
							</div>
						</div>

						{/* Split Among Section - Only for Equal Split */}
						{splitMode === 'equal' && !(allowedShareIds && allowedShareIds.length === 1) && (
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-3">Split Among:</label>
								<div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
										{groupMembers.map(member => (
											<label key={member.id} className="flex items-center space-x-2 cursor-pointer">
												<input
													type="checkbox"
													checked={selectedSplitMembers.includes(member.id.toString())}
													onChange={e => {
														if (e.target.checked) {
															setSelectedSplitMembers(prev => [...prev, member.id.toString()]);
														} else {
															if (selectedSplitMembers.length === 1) return;
															setSelectedSplitMembers(prev => prev.filter(id => id !== member.id.toString()));
														}
													}}
													className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
												/>
												<span className="text-sm text-gray-700">{member.name || member.email}</span>
											</label>
										))}
									</div>
								</div>
							</div>
						)}

						{/* Who Owes Section */}
						<div>
							<div className="flex items-center justify-between mb-3">
								<h3 className="text-lg font-semibold text-gray-900">
									Who Owes
									{!(allowedShareIds && allowedShareIds.length === 1) && (
										<span className="text-sm font-normal text-gray-500 ml-2">
											{splitMode === 'equal' && '(Equal split)'}
											{splitMode === 'percentage' && '(Percentage split)'}
											{splitMode === 'custom' && '(Custom amounts)'}
										</span>
									)}
								</h3>
							</div>
							<div className="space-y-3">
								{expense.shares.map((share, index) => {
									// Exclude already selected users in other share rows
									const selectedUserIds = expense.shares
										.map((s, i) => (i !== index ? s.user_id : null))
										.filter(Boolean);

									const totalAmount = parseFloat(expense.total_amount || 0);
									const shareAmount = parseFloat(share.share_amount || 0);
									const percent = totalAmount > 0 ? ((shareAmount / totalAmount) * 100).toFixed(1) : '0.0';

									return (
										<div key={index} className='bg-gray-50 rounded-lg p-3 border border-gray-200'>
											<div className="flex flex-col sm:flex-row gap-3">
												<div className="flex-1">
													<label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Person</label>
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
																					user_id: e.target.value,
																			  }
																			: s
																),
															})
														}
														className='w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
														required
														disabled={allowedShareIds && allowedShareIds.length === 1}
													>
														<option value=''>Select Person</option>
														{groupMembers
															.filter(member =>
																!selectedUserIds.includes(member.id.toString()) &&
																(!allowedShareIds || allowedShareIds.includes(member.id))
															)
															.map(member => (
																<option key={member.id} value={member.id}>
																	{member.name || member.email}
																</option>
															))}
													</select>
												</div>
												<div className="flex-1 relative">
													<label className="block text-xs font-medium text-gray-600 mb-1 sm:hidden">Amount Owed</label>
													<input
														type='number'
														step='0.01'
														placeholder='Amount owed'
														value={share.share_amount}
														onChange={(e) => handleShareChange(index, e.target.value)}
														className='w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-16'
														required
														disabled={(allowedShareIds && allowedShareIds.length === 1) || splitMode !== 'custom'}
													/>
													{splitMode === 'percentage' && (
														<span className="absolute right-3 top-2.5 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{percent}%</span>
													)}
												</div>
												{splitMode === 'custom' && expense.shares.length > 1 && (
													<div className="flex-shrink-0">
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
															className='w-full sm:w-auto px-3 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium'
															title="Remove share"
														>
															Remove
														</button>
													</div>
												)}
											</div>
										</div>
									);
								})}
								{splitMode === 'custom' && (
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
										className='w-full sm:w-auto bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-100 text-sm font-medium transition-colors'
									>
										+ Add Another Person
									</button>
								)}
							</div>
						</div>

						{/* Validation Summary */}
						<div className='bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200'>
							<h3 className='font-semibold text-gray-900 mb-3 flex items-center'>
								<svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 11h.01M12 7V4a1 1 0 011-1h4a1 1 0 011 1v3M8 21l4-7 4 7M3 4h18M4 4h16v2a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
								</svg>
								Summary
							</h3>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className='text-gray-600'>Total Amount:</span>
										<span className="font-medium">${totalAmount.toFixed(2)}</span>
									</div>
									<div className="flex justify-between">
										<span className='text-gray-600'>Total Paid:</span>
										<span className={`font-medium ${
											Math.abs(totalPaid - totalAmount) < 0.01
												? 'text-green-600'
												: 'text-red-600'
										}`}>
											${totalPaid.toFixed(2)}
										</span>
									</div>
								</div>
								<div className="space-y-2">
									<div className="flex justify-between">
										<span className='text-gray-600'>Total Shares:</span>
										<span className={`font-medium ${
											Math.abs(totalShares - totalAmount) < 0.01
												? 'text-green-600'
												: 'text-red-600'
										}`}>
											${totalShares.toFixed(2)}
										</span>
									</div>
									<div className="flex justify-between">
										<span className='text-gray-600'>Remaining:</span>
										<span className={`font-medium ${
											Math.abs(remainingShares) < 0.01
												? 'text-green-600'
												: 'text-orange-600'
										}`}>
											${remainingShares.toFixed(2)}
										</span>
									</div>
								</div>
							</div>
							{isBalanced && (
								<div className='bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg mt-3 flex items-center'>
									<svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
									All amounts are balanced!
								</div>
							)}
						</div>
					</form>
				</div>

				{/* Footer Actions */}
				<div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 border-t border-gray-100 bg-gray-50">
					<div className='flex flex-col-reverse sm:flex-row justify-end gap-3'>
						<button
							type='button'
							onClick={onClose}
							className='w-full sm:w-auto bg-white text-gray-700 border border-gray-300 rounded-lg px-6 py-2.5 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500'
						>
							Cancel
						</button>
						<button
							type='submit'
							onClick={onUpdate}
							className={`w-full sm:w-auto rounded-lg px-6 py-2.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
								${isBalanced
									? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
									: 'bg-gray-300 text-gray-500 cursor-not-allowed'}
							`}
							disabled={!isBalanced}
						>
							{submitText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditExpenseModal;